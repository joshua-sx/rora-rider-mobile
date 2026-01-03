import express from "express";
import crypto from "crypto";

const app = express();

// ----- Config (Cloud Run env vars) -----
// Key for Google Maps *web services* (Places/Directions/Distance Matrix/etc.)
const GOOGLE_MAPS_WEB_SERVICE_KEY = process.env.GOOGLE_MAPS_WEB_SERVICE_KEY || "";
// Shared secret between your app and this proxy. Required.
const PROXY_TOKEN = process.env.PROXY_TOKEN || "";
// Optional allowlist for CORS (comma-separated origins). If empty, allow all.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!GOOGLE_MAPS_WEB_SERVICE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[maps-proxy] Missing GOOGLE_MAPS_WEB_SERVICE_KEY. Requests will fail."
  );
}
if (!PROXY_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn("[maps-proxy] Missing PROXY_TOKEN. Proxy will reject all calls.");
}

const IS_PROD = process.env.NODE_ENV === "production";

// ----- Tiny CORS helper -----
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allow =
    (!IS_PROD && ALLOWED_ORIGINS.length === 0) ||
    ALLOWED_ORIGINS.includes(String(origin));
  if (allow) {
    res.setHeader("Access-Control-Allow-Origin", String(origin));
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "false");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// ----- Auth -----
function requireProxyAuth(req, res, next) {
  const rawHeader = req.headers.authorization;
  if (Array.isArray(rawHeader)) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  const header = String(rawHeader || "");
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const token = header.slice("Bearer ".length);
  if (!PROXY_TOKEN) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const provided = Buffer.from(token, "utf8");
  const expected = Buffer.from(PROXY_TOKEN, "utf8");
  if (provided.length !== expected.length) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  if (!crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  next();
}

// ----- Basic per-IP rate limiting (in-memory; good enough for v1) -----
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 min
const RATE_LIMIT_MAX = 120; // per IP per minute
const RATE_LIMIT_MAX_BUCKETS = 10_000;
const ipBuckets = new Map(); // ip -> { count, resetAt }

app.set("trust proxy", 1);

function rateLimit(req, res, next) {
  const ip = String(req.ip || req.socket.remoteAddress || "unknown");

  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.delete(ip);
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (ipBuckets.size > RATE_LIMIT_MAX_BUCKETS) {
      const oldestKey = ipBuckets.keys().next().value;
      if (oldestKey) ipBuckets.delete(oldestKey);
    }
    return next();
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ error: "RATE_LIMITED" });
  }

  next();
}

// ----- Helpers -----
function pick(obj, allowedKeys) {
  const out = {};
  for (const key of allowedKeys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

async function callGoogle(url) {
  const resp = await fetch(url);
  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!resp.ok) {
    return { ok: false, status: resp.status, body: json };
  }

  return { ok: true, status: resp.status, body: json };
}

// ----- Routes -----
// Note: Some Google frontends may treat certain health-check paths specially.
// We expose both `/health` and `/healthz` for convenience.
app.get("/health", rateLimit, (_req, res) => res.status(200).send("ok"));
app.get("/healthz", rateLimit, (_req, res) => res.status(200).send("ok"));

// Friendly root response
app.get("/", rateLimit, (_req, res) => res.status(200).send("VoltRun maps proxy ok"));

app.get("/maps/places/autocomplete", rateLimit, requireProxyAuth, async (req, res) => {
  const params = pick(req.query, [
    "input",
    "location",
    "radius",
    "components",
    "language",
    "types",
    "sessiontoken",
  ]);

  if (!params.input) return res.status(400).json({ error: "MISSING_INPUT" });

  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    key: GOOGLE_MAPS_WEB_SERVICE_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${qs}`;
  const result = await callGoogle(url);
  return res.status(result.status).json(result.body);
});

app.get("/maps/places/details", rateLimit, requireProxyAuth, async (req, res) => {
  const params = pick(req.query, ["place_id", "fields", "language", "sessiontoken"]);
  if (!params.place_id) return res.status(400).json({ error: "MISSING_PLACE_ID" });

  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    key: GOOGLE_MAPS_WEB_SERVICE_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${qs}`;
  const result = await callGoogle(url);
  return res.status(result.status).json(result.body);
});

app.get("/maps/directions", rateLimit, requireProxyAuth, async (req, res) => {
  const params = pick(req.query, ["origin", "destination", "mode", "units", "language"]);
  if (!params.origin || !params.destination) {
    return res.status(400).json({ error: "MISSING_ORIGIN_OR_DESTINATION" });
  }

  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    key: GOOGLE_MAPS_WEB_SERVICE_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/directions/json?${qs}`;
  const result = await callGoogle(url);
  return res.status(result.status).json(result.body);
});

app.get("/maps/distance-matrix", rateLimit, requireProxyAuth, async (req, res) => {
  const params = pick(req.query, [
    "origins",
    "destinations",
    "mode",
    "units",
    "language",
  ]);
  if (!params.origins || !params.destinations) {
    return res.status(400).json({ error: "MISSING_ORIGINS_OR_DESTINATIONS" });
  }

  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    key: GOOGLE_MAPS_WEB_SERVICE_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${qs}`;
  const result = await callGoogle(url);
  return res.status(result.status).json(result.body);
});

// (Optional) keep geocoding endpoints out of the proxy for now since your app doesn't rely on them
// outside dev tooling. Add later if needed.

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[maps-proxy] listening on :${port}`);
});

