const INVALID_POLYLINE_MESSAGE = "Invalid polyline encoding";

function decodePolyline(encoded) {
  if (typeof encoded !== "string" || encoded.trim().length === 0) {
    throw new Error(INVALID_POLYLINE_MESSAGE);
  }

  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  if (
    coordinates.length === 0 ||
    coordinates.some(
      (coord) =>
        !Number.isFinite(coord.latitude) ||
        !Number.isFinite(coord.longitude)
    )
  ) {
    throw new Error(INVALID_POLYLINE_MESSAGE);
  }

  return coordinates;
}

function extractRouteData(directions) {
  if (!directions || typeof directions !== "object") {
    throw new Error("Directions response missing route data");
  }

  if (directions.status === "ZERO_RESULTS") {
    throw new Error("No route found");
  }

  const route = directions.routes?.[0];
  const leg = route?.legs?.[0];
  const encoded = route?.overview_polyline?.points;

  if (!leg || !encoded) {
    throw new Error("Directions response missing route data");
  }

  const distanceValue = leg.distance?.value;
  const durationValue = leg.duration?.value;

  if (!Number.isFinite(distanceValue) || !Number.isFinite(durationValue)) {
    throw new Error("Directions response missing distance or duration");
  }

  const coordinates = decodePolyline(encoded);

  if (!coordinates.length) {
    throw new Error("Directions response missing route geometry");
  }

  return {
    distanceKm: distanceValue / 1000,
    durationMin: durationValue / 60,
    coordinates,
  };
}

module.exports = { decodePolyline, extractRouteData };
