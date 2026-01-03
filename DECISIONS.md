# DECISIONS.md  
Joshua's AI Dev OS — Decision Log

This file records **important architectural, product, and process decisions**.

The goal is not documentation for documentation's sake.
The goal is to prevent future confusion, re-debate, and regret.

If a decision required thought, tradeoffs, or debate — it belongs here.

---

## How to Use This File

- One decision per entry
- Keep entries short and factual
- Record context at the time of the decision
- Update only if the decision is explicitly reversed

---

## Decision Log

### D1 — Guest Mode with Rate Limiting and Token-Based History

**Date:**  
2026-01-02

**Context:**  
Tourists and visitors need to use the app immediately without account creation friction. However, we need to prevent abuse and provide a path to claim history.

**Decision:**  
Implement guest mode with:
- Server-generated `guest_token` (30-day TTL)
- Rate limiting: 5 QR generations per hour per guest token
- Guest rides stored against `guest_token_id` (nullable `rider_user_id`)
- After first completed ride, prompt: "Create an account to save your ride history"
- On signup, migrate guest rides to authenticated user account

**Why This Decision Was Made:**
- Fast onboarding critical for tourist market
- Rate limiting prevents abuse without blocking legitimate use
- Token-based approach enables history migration on signup
- 30-day TTL balances user convenience with data retention

**Alternatives Considered:**
- Require signup before first ride — too much friction for tourists
- Device ID only — privacy concerns, unreliable across devices
- Unlimited guest usage — abuse risk

**Consequences:**
- Lower barrier to entry (key for tourist market)
- Guest history can be lost if token expires (30-day window)
- Migration logic required on signup
- Rate limiting prevents spam/abuse

**Revisit When:**
- If abuse patterns emerge
- If 30-day TTL proves too short/long

---

### D2 — Multi-Driver Offers with Rider Selection (Not First-Scan-Wins)

**Date:**  
2026-01-02

**Context:**  
Traditional ride-hailing apps use first-accept-wins or automatic dispatch. Sint Maarten's taxi culture is negotiation-friendly and driver-choice matters.

**Decision:**  
Allow multiple drivers to respond with Accept or Counter offers. Rider sees all offers and selects preferred driver. Drivers cannot see other offers (blind bidding).

**Why This Decision Was Made:**
- Respects local taxi negotiation culture
- Gives riders choice and transparency
- Blind bidding prevents price wars while enabling competition
- Aligns with product goal of trust through transparency

**Alternatives Considered:**
- First-scan-wins (first driver to scan QR gets ride) — too restrictive, no negotiation
- Automatic dispatch (system assigns closest driver) — doesn't respect driver choice culture
- Open bidding (drivers see all offers) — could lead to price wars, bad UX

**Consequences:**
- Riders can compare offers and choose best fit
- Drivers can negotiate via counter-offers
- More complex state management (multiple pending offers)
- Requires offer comparison UI

**Revisit When:**
- If driver adoption is low due to competition
- If offer comparison becomes overwhelming for riders

---

### D3 — QR Session System with JWT Tokens

**Date:**  
2026-01-02

**Context:**  
Need secure, offline-displayable QR codes that can be validated server-side. QR must work even if rider's device loses network.

**Decision:**  
- QR encodes: `session_id` (signed) + basic route summary (origin name, destination name)
- JWT token with short expiry (10 minutes for pre-discovery)
- Token includes `jti` (unique token ID) for revocation
- Single-use token: first successful scan redeems token
- Token revocation via Redis/in-memory cache keyed by `jti`
- QR cached locally for offline display

**Why This Decision Was Made:**
- Offline-first requirement (tourist areas may have poor connectivity)
- Security: server-side validation prevents tampering
- Single-use tokens prevent replay attacks
- JWT standard format is well-supported and auditable

**Alternatives Considered:**
- Full session data in QR — too large, security risk
- No token validation — security risk
- Long-lived tokens — security risk

**Consequences:**
- QR works offline (cached display)
- Server-side validation prevents tampering
- Token revocation enables single-use enforcement
- Requires token service (Edge Function)

**Revisit When:**
- If token revocation becomes a bottleneck
- If QR size becomes an issue

---

### D4 — Discovery Wave System (Favorited → Nearby → Expanded)

**Date:**  
2026-01-02

**Context:**  
Need to notify drivers efficiently without overwhelming them or riders. Sparse driver availability in some areas requires gradual expansion.

**Decision:**  
Implement wave-based discovery:
- **Wave 0**: Favorited drivers (immediate, priority)
- **Wave 1**: Nearby drivers with matching service area tags (2 km radius)
- **Wave 2+**: Expanded radius (5 km, 10 km) if no responses after ~10 minutes
- Admin-configurable radii per region
- Rider prompted: "Want us to look a bit farther out?" before expansion

**Why This Decision Was Made:**
- Prioritizes favorites (better UX for returning riders)
- Gradual expansion handles sparse driver availability
- Rider consent prevents feeling pushy
- Admin-configurable allows per-region tuning

**Alternatives Considered:**
- Notify all drivers at once — spam, poor UX
- Fixed radius only — misses drivers in sparse areas
- Automatic expansion without rider consent — feels pushy

**Consequences:**
- Efficient driver notification (prioritize favorites and nearby)
- Respects rider choice (consent before expansion)
- Handles sparse driver availability gracefully
- Requires wave tracking in database

**Revisit When:**
- If wave timing needs adjustment
- If driver density changes significantly

---

### D5 — Append-Only Ride Events Ledger

**Date:**  
2026-01-02

**Context:**  
Need audit trail for ride state transitions, disputes, and compliance. "What happened during this ride?" must be answerable.

**Decision:**  
Build `ride_events` table as append-only ledger:
- Every state transition logged as event
- Events include: `ride_session_id`, `event_type`, `metadata` (JSON)
- No updates or deletes (immutable)
- Source of truth for ride history

**Why This Decision Was Made:**
- Trust is the main product — audit trail is non-negotiable
- Immutable logs prevent tampering
- Easy to query and debug disputes
- Foundation for compliance and transparency

**Alternatives Considered:**
- Update `ride_sessions.status` only — no audit trail
- Use Supabase's built-in audit — less control, harder to query
- Add audit logging later — painful to retrofit

**Consequences:**
- Complete audit trail for disputes
- Storage overhead (but minimal for MVP scale)
- Easy to query "what happened" for any ride
- Required for trust and transparency

**Revisit When:**
- Never — this is foundational for trust

---

### D6 — Cash-First, Negotiation-Friendly Approach

**Date:**  
2026-01-02

**Context:**  
Sint Maarten taxi culture is cash-first. Drivers negotiate prices. Government rates exist but are guidelines, not mandates.

**Decision:**  
- No in-app payments (MVP)
- Rora Fare is a price anchor (not a mandate)
- Drivers can Accept, Counter (any price), or Decline
- Price context labels inform riders ("Good deal", "Pricier than usual") but don't restrict drivers
- Cash payment at ride completion

**Why This Decision Was Made:**
- Respects local taxi culture (cash-first, negotiation is normal)
- Reduces MVP complexity (no payment processing, compliance)
- Builds trust through transparency without price control
- Aligns with product goal of cultural fit

**Alternatives Considered:**
- Fixed pricing (no negotiation) — doesn't respect local culture
- In-app payments — too complex for MVP, requires compliance
- Driver-set prices only — no price transparency for riders

**Consequences:**
- Respects local taxi norms
- Builds trust through transparency (Rora Fare)
- Allows negotiation (cultural fit)
- No payment processing complexity in MVP

**Revisit When:**
- When adding in-app payments (v0.2+)
- If pricing disputes become common

---

### D7 — State Machine for Ride Lifecycle

**Date:**  
2026-01-02

**Context:**  
Rides have complex lifecycle: created → discovery → offers → hold → confirmed → active → completed/canceled. Invalid transitions must be prevented.

**Decision:**  
Enforce state machine server-side (Edge Functions):
```
created → discovery → [offers received] → hold → confirmed → active → completed
                                                                    ↘ canceled
                      ↘ expired (no offers / timeout)
```
- State transitions validated in Edge Functions
- Invalid transitions blocked with error
- State changes logged to `ride_events`
- UI reflects state but doesn't enforce it

**Why This Decision Was Made:**
- Prevents invalid states that cause bugs and disputes
- Server-side enforcement is security boundary (client can be tampered)
- Clear lifecycle makes debugging and support easier
- State changes logged for audit trail

**Alternatives Considered:**
- Client-side state management only — security risk
- Database triggers only — harder to debug, less flexible
- No state machine — chaos, invalid states possible

**Consequences:**
- Prevents invalid state transitions
- Clear ride lifecycle
- Server-side enforcement (security)
- Requires state validation logic in Edge Functions

**Revisit When:**
- If new states are needed (e.g., "scheduled")
- If state transitions become too complex

---

### D8 — Edge Functions for Business Logic (Not Client-Side)

**Date:**  
2026-01-02

**Context:**  
Ride state transitions, pricing calculations, QR validation, and discovery waves require server-side logic. Client code can be tampered with.

**Decision:**  
Use Supabase Edge Functions for:
- Ride state transitions (`transition-ride-state`)
- QR token validation (`validate-qr-token`)
- Fare calculation (`calculate-fare`)
- Discovery wave orchestration
- All business logic that affects ride state or pricing

**Why This Decision Was Made:**
- Security: client code can be tampered with
- Centralized logic easier to maintain and test
- Supabase Edge Functions are simpler than custom REST API
- Serverless deployment reduces infrastructure overhead

**Alternatives Considered:**
- Client-side only — security risk, can be tampered with
- REST API server — more infrastructure, Supabase Edge Functions are simpler
- Database functions only — harder to test, less flexible

**Consequences:**
- Secure business logic (can't be tampered with)
- Centralized logic (easier to maintain)
- Requires Edge Function deployment process
- Slightly more latency than client-side (acceptable trade-off)

**Revisit When:**
- If Edge Functions become a bottleneck
- If we need more complex orchestration

---

### D9 — Privacy-First Location Storage

**Date:**  
2026-01-02

**Context:**  
Store ride origins and destinations, but respect privacy. Full addresses are PII and unnecessary for pricing/routing.

**Decision:**  
Store:
- Coordinates (`origin_lat`, `origin_lng`, `destination_lat`, `destination_lng`)
- Coarse labels (`origin_label`, `destination_label`) — e.g., "PJIAE Airport", "Maho Beach"
- Optional freeform name (`destination_freeform_name`) — e.g., "Sunset Bar"

Avoid storing:
- Full street addresses
- Building numbers
- Exact apartment/room numbers

**Why This Decision Was Made:**
- Privacy-first approach reduces PII exposure
- Coarse labels sufficient for pricing and display
- Coordinates enable distance calculations
- Balances functionality with privacy

**Alternatives Considered:**
- Store full addresses — privacy risk, unnecessary
- Coordinates only — harder to display in UI
- No location storage — can't show ride history

**Consequences:**
- Privacy-friendly (coarse location only)
- Sufficient for pricing and display
- Coordinates enable distance calculations
- Labels enable human-readable history

**Revisit When:**
- If riders need more precise location history
- If privacy regulations change

---

### D10 — Supabase Realtime for Instant Updates

**Date:**  
2026-01-02

**Context:**  
Riders need to see driver offers instantly. Polling is inefficient and creates lag. Push notifications are fallback, not primary.

**Decision:**  
Use Supabase Realtime subscriptions for:
- Driver offer notifications (new offers appear instantly)
- Ride status updates (state changes broadcast)
- Hold/confirmation state changes

Fallback to:
- Push notifications (if app backgrounded)
- Polling (if Realtime fails)

**Why This Decision Was Made:**
- Instant updates critical for competitive offer comparison
- Supabase Realtime is built-in (no additional infrastructure)
- More efficient than polling (reduces server load)
- Fallback strategy ensures reliability

**Alternatives Considered:**
- Polling only — inefficient, laggy
- Push notifications only — not instant, requires device online
- WebSockets (custom) — more infrastructure, Supabase Realtime is simpler

**Consequences:**
- Instant updates (great UX)
- Efficient (no polling overhead)
- Requires Realtime subscription management
- Fallback needed for reliability

**Revisit When:**
- If Realtime becomes unreliable
- If scale requires different approach

### D11 — Supabase Over Firebase

**Date:**  
2026-01-02

**Context:**  
We needed to choose a backend platform for MVP that provides authentication, database, real-time subscriptions, and serverless functions.

**Decision:**  
Use Supabase (PostgreSQL + Auth + Realtime + Edge Functions) instead of Firebase.

**Why This Decision Was Made:**
- PostgreSQL is more flexible than Firestore (SQL queries, joins, complex queries)
- Built-in Row-Level Security (RLS) for fine-grained access control
- Supabase Auth supports SMS OTP and email magic links (required for MVP)
- Realtime subscriptions built-in (no additional setup)
- Edge Functions (Deno) simpler than Firebase Cloud Functions for MVP
- Single platform reduces infrastructure complexity
- Free tier sufficient for MVP (50K users)
- Open source option available if needed

**Alternatives Considered:**
- Firebase (Auth + Firestore + Cloud Functions) — less flexible queries, NoSQL limitations
- Custom backend (Node.js + PostgreSQL) — too much infrastructure for MVP
- AWS Amplify — more complex setup, overkill for MVP

**Consequences:**
- Faster MVP development (single platform)
- SQL database enables complex queries and joins
- RLS policies provide security at database level
- Vendor lock-in to Supabase (acceptable for MVP)
- May need to migrate if scale requires different architecture

**Revisit When:**
- If Supabase becomes a bottleneck at scale
- If pricing becomes prohibitive
- If we need features Supabase doesn't support

---

### D12 — Expo Over React Native CLI

**Date:**  
2026-01-02

**Context:**  
We needed to choose a React Native framework for cross-platform iOS and Android development.

**Decision:**  
Use Expo (managed workflow) instead of React Native CLI (bare workflow).

**Why This Decision Was Made:**
- Faster development (no native code compilation during dev)
- Built-in tooling (Expo Router, EAS Build, OTA updates)
- Easier onboarding (less native development knowledge required)
- OTA updates enable bug fixes without app store review
- EAS Build handles iOS/Android builds without local setup
- Expo SDK includes many required features (camera, location, push notifications)
- Can eject to bare workflow later if needed

**Alternatives Considered:**
- React Native CLI — more control but slower development, requires native knowledge
- Flutter — different language (Dart), larger learning curve
- Native iOS/Android — too much development overhead for MVP

**Consequences:**
- Faster MVP development and iteration
- Easier to maintain (less native code)
- OTA updates enable rapid bug fixes
- Some native modules may require custom development
- Can eject to bare workflow if needed (one-way operation)

**Revisit When:**
- If we need native modules Expo doesn't support
- If performance requires native optimizations
- If app store policies change regarding OTA updates

---

### D13 — Retool/Appsmith for Admin Dashboard (Not Custom React)

**Date:**  
2026-01-02

**Context:**  
We needed an admin dashboard for driver verification, pricing management, and support queue. MVP scope requires fast delivery without building custom admin UI.

**Decision:**  
Use Retool or Appsmith (low-code admin dashboard) instead of building custom React admin app.

**Why This Decision Was Made:**
- Faster to build (connect to Supabase, drag-and-drop UI)
- No frontend code to maintain (admin is internal tool)
- Built-in authentication and permissions
- Can iterate quickly on admin features
- Focus development time on rider app (core product)
- Cost-effective for MVP (internal tool, low user count)

**Alternatives Considered:**
- Custom React admin app — too much development time for MVP
- Supabase Dashboard — insufficient customization
- Spreadsheet + manual process — not scalable, error-prone

**Consequences:**
- Fast admin dashboard delivery (days vs weeks)
- Less code to maintain
- Admin features can be added quickly
- Vendor lock-in to Retool/Appsmith (acceptable for internal tool)
- May need to rebuild if requirements outgrow low-code platform

**Revisit When:**
- If admin requirements become too complex for low-code
- If we need custom workflows Retool/Appsmith can't handle
- If pricing becomes prohibitive

---

## Review Rule

This file should be consulted:
- before refactors
- before changing architecture
- when onboarding collaborators
- when you forget why something exists

If a decision is undocumented, it is easy to undo accidentally.