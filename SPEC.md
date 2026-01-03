# Rora Ride — MVP Spec (Rider App)

**Doc Type:** Software Specification / PRD
**Version:** v1.0 (MVP)
**Status:** Final Draft
**Owner:** Joshua Bowers
**Last Updated:** 2026-01-02
**Target Platform:** iOS + Android (Expo / React Native)
**Primary Market:** Sint Maarten (tourist-facing), starting Dutch side
**Scope:** Rider app only (Driver app is a separate product)

---

## 1) Overview

Rora Ride helps riders (especially tourists) **find verified taxis**, **see transparent fare estimates**, and **log rides safely** using a **QR handshake** between rider and driver.

This MVP respects real-world taxi norms:
- **Cash-first culture** — no in-app payments
- **Negotiation is normal** — drivers can counter the Rora Fare
- **Trust is the main product** — verification, transparency, logged records

The Rora Fare is a single authoritative price anchor aligned with government and taxi association rates. Drivers may accept, counter, or decline. Rora provides price clarity without price control.

---

## 2) Problem Statement

Taxi transportation in Sint Maarten is fragmented:
- Riders don't know which drivers are trustworthy
- Pricing is opaque, inconsistent, and causes disputes
- There is little proof of what was agreed and when

Result: distrust, friction, and worse tourism experience.

---

## 3) Goals

### Product Goals
**Riders can:**
- Browse a verified taxi directory with filters
- Estimate a fare for any route (Rora Fare)
- Generate a QR ride session and broadcast to nearby drivers
- Request a specific driver directly (from favorites or directory)
- Receive and compare driver offers
- Negotiate via counter-offers
- View ride history (after signup)

### Business Goals
- Prove the core loop: estimate → QR → discovery → accept → log
- Build trust and adoption before payments and compliance-heavy features
- Create foundation for Rora Pro (premium driver tier) monetization

### Success Metrics (MVP)
- Estimate created → QR generated conversion rate
- QR generated → driver offer received rate
- Offer received → rider confirmed rate
- Confirmed → completed rate
- 7-day returning riders
- % of guest rides claimed after account creation

---

## 4) Non-Goals (Out of scope for MVP)

- In-app payments
- Surge pricing
- Auto dispatch / automatic driver matching
- Live ride tracking during trip
- Loyalty, referrals, levels, marketplace
- Scheduled rides (v0.2)
- Driver app (separate product)
- Multi-language support (English only for MVP)
- Dark mode

---

## 5) Stakeholders

- **Riders:** tourists, visitors, locals
- **Taxi Drivers:** independent / association members (via separate driver app)
- **Admin/Operations:** verification + moderation + pricing config (via Retool/Appsmith)
- **Government / Taxi Association:** pricing transparency alignment (non-technical stakeholder)

---

## 6) Personas & Permissions

### Rider (Primary)
- Browse directory, estimate fare, generate QR session, negotiate, view history
- **Permissions:**
  - Guest: browsing, estimation, QR generation (rate-limited)
  - Authenticated: save favorites, claim history, persistent ride history, ratings

### Admin (Internal)
- **Permissions:**
  - Verify/suspend drivers
  - Manage pricing zones and rule versions
  - Manage moderation queue + support queue
  - Audit logs + aggregate analytics

---

## 7) Authentication

### Rider Authentication
- **Primary:** SMS OTP (shown by default for fast onboarding)
- **Secondary:** Email magic link (available for tourists without local SIM)
- Rider can switch between methods at login screen
- **OTP Retry Logic:** 2 retries with 30s cooldown, then show fallback option

### Guest Mode Strategy
- Guests can browse + estimate + generate QR (rate-limited: 5 QRs/hour)
- Guest rides stored against server-generated `guest_token`
- **Guest token TTL:** 30 days
- After first **completed** ride, prompt: "Create an account to save your ride history"
- On signup, migrate guest rides to authenticated user account
- If guest token expires or device changes, guest history is unrecoverable unless previously claimed

---

## 8) Discovery & Ride Flow

### Overview
A ride request has two phases:
1. **Discovery Phase** (no commitment) — rider broadcasts, drivers respond
2. **Commitment Phase** (locked) — rider confirms a driver, ride proceeds

### Phase 1: Discovery

#### Step A — Generate Fare (Not Live)
1. Rider selects origin + destination
2. App calculates single **Rora Fare**
3. App generates QR session
4. **No drivers notified yet**
5. Rider sees:
   - Rora Fare (single number, no breakdown shown)
   - QR code (cached for offline display)
   - Button: "Look for drivers"

#### Step B — Rider Taps "Look for drivers" (Start Discovery)
1. Ride enters **Discovery Mode**
2. System sends notification to nearby drivers (Wave 1)
3. QR session becomes active and scannable
4. Rider may:
   - Cancel at any time
   - Show QR to a driver in person
   - Wait without seeing any countdown or pressure

**Important:** Rider does NOT see a timer or countdown. Discovery feels open-ended.

#### Discovery Escalation Logic (Server-Side)

**Wave 1 — Initial nearby drivers**
- Notify drivers within smallest radius / closest set
- Priority given to drivers with matching service area tags (e.g., Airport pickup → notify Airport Association drivers first)
- Drivers can Accept, Counter, or Ignore

**Wave 2+ — Expanded radius**
- If no responses after ~10 minutes, prompt rider:
  - "We couldn't find a nearby driver yet. Want us to look a bit farther out?"
  - Options: Expand search | Cancel
- If rider expands, notify next batch of drivers at larger radius
- Radius increments are **admin-configured per region**

**Discovery Exhaustion**
- If no drivers respond after extended period (~45-60 minutes):
  - Notify rider: "We couldn't find a driver available right now."
  - Options: Try again later | Adjust pickup location | Cancel
- Session can be auto-expired server-side or remain inactive

#### Driver Response Options
- **Accept:** Agree to Rora Fare
- **Counter:** Propose different price (any amount, higher or lower)
- **Decline:** Pass on this ride

Offers are recorded. No commitment yet.

#### Background Discovery
- Discovery continues even if rider backgrounds/closes app
- Rider receives push notification for each Accept/Counter:
  - "A driver accepted your ride for $20"
  - "A driver countered: $25. Tap to review."
- Bundle notifications if multiple arrive within 30-60 seconds
- After 10 minutes with pending offers and no rider action:
  - Push reminder: "You have X drivers waiting for your response"
  - Repeat at 20 minutes (max 2 reminders)

### Viewing Offers

#### Offer Display
- Show **top 3 offers** prominently
- "+ X more offers" collapsed/expandable
- Each offer shows:
  - Price
  - Driver name + photo
  - Verification badge (if applicable)
  - Rora Pro badge (if applicable)
  - Distance from pickup

#### Price Context Labels (Google Flights-inspired)
Informational labels help riders compare offers without restricting drivers:

| Condition | Label | Tooltip |
|-----------|-------|---------|
| Offer ≤ Rora Fare − 20% | **Good deal** | "This offer is lower than the estimated fare for this route." |
| Offer within −20% to +30% | *(no label)* | — |
| Offer ≥ Rora Fare + 30% | **Pricier than usual** | "This offer is higher than the estimated fare. You may want to compare other offers." |

Thresholds are admin-configurable per region.

### Phase 2: Commitment

#### Hold Phase
1. Rider taps "Select" on an offer
2. Ride enters **Hold** state
3. Driver's offer is binding (no confirmation step required from driver)
4. **5-minute hold timeout** (no visible timer to rider)
5. If driver doesn't respond/confirm arrival, hold auto-releases
6. Rider can fall back to second-choice offer if first driver times out

#### In-Person Scan Override
If a driver physically scans QR while rider has selected a different (remote) driver:
- Prompt rider: "A driver is here in person. Switch to them?"
- Rider decides which driver to proceed with

#### Commitment Triggers
Commitment begins when:
- Rider taps "Confirm driver", OR
- Driver scans QR in person / marks arrival

From commitment onward, ride proceeds to Active state.

### Ride States

```
created → discovery → [offers received] → hold → confirmed → active → completed
                                                                    ↘ canceled
                      ↘ expired (no offers / timeout)
```

#### State Definitions
- **created:** QR generated, not yet broadcasting
- **discovery:** Broadcasting to drivers, collecting offers
- **hold:** Rider selected a driver, awaiting confirmation
- **confirmed:** Both parties committed, ride ready to start
- **active:** Ride in progress
- **completed:** Ride finished successfully
- **canceled:** Canceled by rider (before active) or admin
- **expired:** No offers received or session timed out

#### Cancellation Rules
- **During Discovery/Hold:** Rider may cancel freely (logged)
- **After Confirmation:** Restricted — logged as high-impact event
- **During Active:** No in-app cancel for rider; only admin force-cancel

---

## 9) Direct Driver Request

### Entry Points
- Favorites tab → Driver profile → "Request this driver"
- Drivers directory → Driver profile → "Request this driver"

### Flow
1. Rider taps "Request this driver"
2. Opens route builder (origin + destination)
3. App calculates Rora Fare
4. On confirm, system notifies **only that driver**
5. Driver can Accept, Counter, or Decline
6. If no response within 10 minutes, prompt:
   - "No response yet. Want to search nearby drivers instead?"
   - Options: Search nearby | Keep waiting | Cancel
7. If rider chooses "Search nearby," session switches to broadcast mode

### Driver Controls
- Drivers can set: "Allow direct requests: On/Off"
- If Off, driver profile shows: "Not accepting requests" (text, not button)

---

## 10) QR Token System

### QR Payload (Hybrid)
QR encodes:
- `session_id` (signed)
- Basic route summary (origin name, destination name)
- Full details fetched from server on scan

### Token Mechanism
- **JWT** with:
  - Short expiry (default 10 minutes for pre-discovery)
  - `jti` unique token ID
  - Claims: `session_id`, `created_at`, `nonce`, `region_id`
- **Single-use:** First successful scan redeems token (for non-bidding flows)
- **Revocation:** Redis/in-memory cache keyed by `jti`

### Offline Behavior
- Generated QR can be displayed offline (cached locally)
- Driver scan requires network to validate

### Scan Feedback
- Plain black/white QR (no embedded branding for reliability)
- On successful scan: success animation + haptic buzz on rider's device

---

## 11) Pricing System

### Rora Fare Philosophy
The Rora Fare is a single authoritative price anchor:
- Aligned with government and taxi association official rates
- Displayed to both rider and driver
- Drivers may Accept, Counter, or Decline
- Rora provides price clarity without price control

### Pricing Logic

#### Zone-Based Pricing
- If origin OR destination matches a fixed-fare zone, use zone pricing
- If both match zones and a zone-to-zone rule exists, use it
- Else fall back to distance-based pricing

#### Distance-Based Pricing
- Base fare + per-km rate
- Haversine distance fallback for offline (with configurable multiplier, default 1.3x)

#### Zones for MVP (Sint Maarten)
1. **PJIAE Airport** (Princess Juliana International)
2. **Philipsburg Cruise Port**
3. **Maho Beach / Hotel District**

Zones defined as **radius circles** (center point + radius in meters).

### Pricing Modifiers
Configurable modifiers that can adjust the base fare:
- Night/Peak (time-based)
- Events (manual toggle)
- Future: vehicle type, luggage, etc.

**Modifier Configuration:**
- Per-region toggle (enable/disable each modifier per region)
- Stored in `pricing_calculation_metadata` with breakdown + `applied_modifiers`

### Fare Display
- **Single number** shown to rider (e.g., "$20")
- No inline breakdown
- Disclaimer shown once per session: "Final fare may be negotiated" (dismissable with "Got it")

### Audit Trail
Each ride stores:
- `pricing_rule_version_id`
- `pricing_calculation_metadata` (JSON: base, distance, zone rule, modifiers applied)

---

## 12) Driver Directory

### Profile Data
- Display name, photo(s)
- Seats, languages, vehicle type
- Service area tags (informational)
- Contact info (phone/WhatsApp) — **opt-in, always visible on profile**
- Verification badges
- Rora Pro badge (if applicable)

### Service Area Tags
Informational tags for rider discovery:
- **Airport Association:** Usually based at PJIAE taxi area
- **Cruise Port Association:** Usually based near Philipsburg cruise pier
- **VIP / Luxury:** Higher-end vehicles / premium service

Tags create **priority in notification waves**, not exclusion:
- Wave 1: Drivers with matching tags notified first
- Wave 2+: All other nearby drivers

### Directory Filters (All Optional, Off by Default)
1. **Service Area Tags** — Filter by Airport, Cruise Port, VIP
2. **Vehicle Capacity** — Filter by seats (4+, 6+, 8+)
3. **Languages Spoken** — English, Spanish, French, Dutch, etc.
4. **Rora Pro** — Filter to show only Rora Pro drivers

Filters affect directory browsing only, not ride eligibility.

### Data Caching
- Driver profiles cached locally with **24-hour TTL**
- Allows offline browsing of recently viewed drivers

---

## 13) Verification & Rora Pro

### Baseline Verification
All drivers on Rora are baseline verified through government and/or taxi association onboarding. This is a **prerequisite** to be on the platform.

### Verification Types (Stored)
- `GOVERNMENT_REGISTERED` — License/plate verified with government
- `RORA_VERIFIED` — Identity check by Rora admin

### Rora Pro (Premium Tier)
**What Rora Pro means:**
- Meets all baseline verification requirements
- Maintains active, complete driver profile
- In good standing (no suspensions, unresolved reports)
- Opted into paid premium tier

**What Rora Pro does NOT do:**
- Change pricing rules
- Override negotiation logic
- Automatically rank drivers higher
- Imply higher safety than other drivers

**Display:**
- Small "Rora Pro" badge on offer cards and driver profiles
- Tooltip: "This driver has a premium profile with additional verification and active standing on Rora."

### Driver Status (Separate from Verification)
- `ACTIVE` — Can participate in rides
- `UNVERIFIED` — Badge removed, can still use app
- `SUSPENDED` — Blocked from ride participation

---

## 14) Ratings & Reporting

### Ratings
**Who can rate:**
- Only authenticated riders after completed rides
- Guests cannot rate

**Rating mechanics:**
- Optional, never forced
- Simple: 1-5 stars OR thumbs up/down
- No text comments
- Aggregated scores only (no per-ride public feedback)
- **Not shown until minimum volume** (5-10 ratings)
- No timestamps shown publicly

**What drivers cannot do:**
- Drivers cannot rate riders
- Drivers cannot see who rated them
- Drivers cannot dispute individual ratings in-app

### Reporting
**Flow:**
1. Rider opens completed ride detail
2. Taps "Report Issue"
3. Selects category:
   - Wrong fare
   - No-show
   - Unsafe behavior
   - Other
4. Optional freeform notes
5. Submit creates admin support ticket

**Visibility:**
- Driver is NOT notified unless admin takes action
- Reports go to admin moderation queue with ride context

**Support Channel:**
- In-app link to support email/WhatsApp for MVP

---

## 15) Ride History

### List View
- Minimal display: date, origin → destination, amount
- No driver info shown in list (privacy)

### Detail View
- Full route summary
- Agreed fare
- Timestamps
- "Favorite this driver" action
- "Report Issue" action

### Completion Flow
- After ride marked complete, show **summary screen**:
  - Route, agreed fare, driver name
  - "Done" button returns to home
- Optional rating prompt (not required)

---

## 16) Favorites

### Functionality
- Save drivers for quick access
- View list of favorited drivers
- Tap to view profile
- "Request this driver" initiates direct request flow

### Priority Benefit
- Favorited drivers get **Wave 0** priority in broadcast notifications
- Notified before general nearby drivers

---

## 17) Maps & Location

### Location Permission
- **Required for core flow?** No — app works with manual origin selection
- **Behavior if denied:** App functional with persistent (dismissable) prompt:
  - "Enable location for faster pickup"

### "Use My Location"
- Show last known location immediately
- GPS acquires in background for accuracy
- If GPS fails, use last known or prompt manual entry

### Origin/Destination Selection
- Map pin (tap to place)
- Places search (Google Places autocomplete)
- "Use my location" button
- Saved locations (future)

### POI Fallback
If destination not found in Google/Apple Maps:
1. Prompt: "Can't find that place. Tap the map to set your destination."
2. Rider drops pin
3. Optionally add freeform place name (e.g., "Sunset Bar")
4. Driver uses local knowledge; pricing based on pin location

### Home Screen Map
- Clean map with rider's location only
- No driver markers (no real-time availability display)

### Offline Estimation
- If cached known route exists, reuse cached distance/time
- Else use **haversine distance × configurable factor** (default 1.3)
- Display "Offline estimate" disclaimer

---

## 18) Notifications

### Infrastructure
- **Expo Push** for MVP
- In-app notification inbox as fallback
- Ride status polling when app foregrounded

### Critical Events (Push)
**Rider receives:**
- Driver submitted offer (Accept or Counter)
- Hold timeout warning
- Ride confirmed
- Ride completed

**Notification bundling:**
- If multiple offers arrive within 30-60 seconds, bundle:
  - "3 drivers responded. Tap to view offers."

### Deep Links
- Push notifications deep link to relevant screen (offers list, ride detail, etc.)

---

## 19) Discovery UX

### Progress Animation
While "Looking for drivers":
- Modern rotating status text animation
- Phrases cycle: "Finding drivers" → "Checking availability" → "Sending requests" → "Matching your ride"
- Subtle fade/slide transitions
- No countdown or timer shown

### No Coverage
If no drivers available after exhaustion:
- "No drivers available right now. Try again later."
- Simple, no promises or alternatives

---

## 20) Functional Requirements (Numbered)

### 20.1 Authentication & Guest Mode
- **FR-1:** Rider shall use app without account for browsing, estimation, and QR generation (rate-limited).
- **FR-2:** Rider shall authenticate via SMS OTP (primary) or email magic link (secondary).
- **FR-3:** OTP retry logic: 2 retries with 30s cooldown, then show fallback.
- **FR-4:** Guest rides stored against server-generated `guest_token` (30-day TTL).
- **FR-5:** After first completed guest ride, prompt account creation to claim history.
- **FR-6:** On signup, migrate guest token rides to authenticated user.

### 20.2 Maps & Routing
- **FR-7:** App shall allow origin/destination selection via map pin, places search, or "use my location."
- **FR-8:** App shall calculate route distance + duration via Google Maps Directions API.
- **FR-9:** App shall support offline haversine fallback with configurable multiplier (default 1.3).
- **FR-10:** App shall handle POI not found with pin + freeform name fallback.

### 20.3 Pricing
- **FR-11:** App shall compute Rora Fare using zone pricing (if applicable) or distance-based estimation.
- **FR-12:** Zone applicability: if origin OR destination in zone with matching rule, use zone pricing.
- **FR-13:** Zones defined as radius circles (center + radius).
- **FR-14:** Admin shall configure zones, fixed fares, distance parameters, and modifiers per region.
- **FR-15:** Each ride shall store `pricing_rule_version_id` and `pricing_calculation_metadata`.
- **FR-16:** Modifiers (night, peak, event) toggleable per region.

### 20.4 QR & Discovery
- **FR-17:** App shall generate QR session with hybrid payload (session_id + route summary).
- **FR-18:** QR token shall be JWT with 10-minute expiry, `jti`, and relevant claims.
- **FR-19:** Generated QR shall be cached for offline display.
- **FR-20:** Discovery shall broadcast to nearby drivers in waves (admin-configured radius per region).
- **FR-21:** Service area tags shall create notification priority (Wave 0/1), not exclusion.
- **FR-22:** Discovery shall continue in background; rider notified via push.
- **FR-23:** After 10 minutes with pending offers, send reminder push.

### 20.5 Offers & Selection
- **FR-24:** Rider shall see top 3 offers + "+ X more" expandable.
- **FR-25:** Each offer shall display price, driver info, badges, and distance.
- **FR-26:** Price context labels shall be applied based on configurable thresholds.
- **FR-27:** Driver offers are binding; no driver confirmation step after rider selects.
- **FR-28:** Hold phase lasts 5 minutes; auto-releases if driver unresponsive.
- **FR-29:** Rider can fall back to second-choice offer if first times out.
- **FR-30:** In-person QR scan during hold prompts rider to choose.

### 20.6 Direct Request
- **FR-31:** Rider shall initiate direct request from driver profile ("Request this driver").
- **FR-32:** Direct request notifies only target driver.
- **FR-33:** If no response in 10 minutes, prompt to expand to broadcast.
- **FR-34:** Drivers with "Allow direct requests: Off" show "Not accepting requests" on profile.

### 20.7 Ride Lifecycle
- **FR-35:** Ride states: created, discovery, hold, confirmed, active, completed, canceled, expired.
- **FR-36:** State transitions enforced; conflicting transitions blocked.
- **FR-37:** All transitions logged to append-only `ride_events` table.
- **FR-38:** Cancellation allowed freely during discovery/hold; restricted after confirmation.
- **FR-39:** No rider cancel during active state (admin only).

### 20.8 Driver Directory
- **FR-40:** Rider shall browse and filter drivers by: service area, capacity, languages, Rora Pro.
- **FR-41:** Filters off by default; combinable.
- **FR-42:** Driver profiles cached locally (24h TTL).
- **FR-43:** Contact info (phone/WhatsApp) visible on profile if driver opted in.

### 20.9 Verification & Pro
- **FR-44:** All drivers baseline verified (prerequisite to platform).
- **FR-45:** Verification types stored: GOVERNMENT_REGISTERED, RORA_VERIFIED.
- **FR-46:** Rora Pro badge displayed on offer cards and profiles.
- **FR-47:** Driver status: ACTIVE, UNVERIFIED, SUSPENDED.

### 20.10 Ratings & Reporting
- **FR-48:** Authenticated riders can optionally rate drivers (1-5 stars) after completion.
- **FR-49:** Ratings aggregated; not shown until minimum threshold (5-10).
- **FR-50:** Drivers cannot rate riders or see individual ratings.
- **FR-51:** Rider can report issue from ride detail (categories + optional notes).
- **FR-52:** Reports create admin support tickets; driver not notified unless action taken.

### 20.11 History & Favorites
- **FR-53:** Rider shall view ride history (minimal: date, route, amount).
- **FR-54:** Ride detail includes driver info, fare, timestamps, favorite/report actions.
- **FR-55:** Rider can favorite drivers; favorites get Wave 0 notification priority.

### 20.12 Notifications
- **FR-56:** Push notifications via Expo Push for critical ride events.
- **FR-57:** In-app notification inbox as fallback.
- **FR-58:** Push notifications deep link to relevant screens.
- **FR-59:** Notification bundling for multiple rapid offers.

### 20.13 Abuse Prevention
- **FR-60:** Rate limit QR generation: 5/hour per guest token or user.
- **FR-61:** Log suspicious activity for admin review.

---

## 21) Non-Functional Requirements

- **NFR-1 (Performance):** Estimate screen loads within 2 seconds on typical mobile networks.
- **NFR-2 (Security):** JWT tokens signed (HS256 or RS256), short-lived, revocable.
- **NFR-3 (Auditability):** `ride_events` append-only ledger is source of truth.
- **NFR-4 (Privacy):** Store coordinates + coarse labels; avoid full address strings.
- **NFR-5 (Resilience):** App usable when push fails; inbox + polling provide continuity.
- **NFR-6 (Offline):** QR displayable offline; fare estimate fallback available.

---

## 22) Data Model (High-Level)

### Core Tables
- `regions`
- `users`
- `guest_tokens`
- `driver_profiles`
- `driver_verifications`
- `pricing_zones`
- `pricing_rule_versions`
- `pricing_fixed_fares`
- `pricing_modifiers`
- `ride_sessions`
- `ride_offers`
- `rides`
- `ride_events` (append-only)
- `ride_reports`
- `ratings`
- `favorites`
- `devices` (push tokens)
- `notifications_inbox`

### Regions
```
regions:
  - id
  - country_code
  - island_name
  - currency_code (USD for MVP)
  - distance_unit (km)
  - default_pricing_rule_version_id
  - discovery_radius_config (JSON: wave radii)
  - is_active
```

### Ride Session
```
ride_sessions:
  - id
  - region_id
  - rider_user_id (nullable)
  - guest_token_id (nullable)
  - origin_lat, origin_lng, origin_label
  - destination_lat, destination_lng, destination_label
  - destination_freeform_name (nullable)
  - rora_fare_amount
  - pricing_rule_version_id
  - pricing_calculation_metadata (JSON)
  - request_type (broadcast | direct)
  - target_driver_id (nullable, for direct)
  - status (created | discovery | hold | confirmed | active | completed | canceled | expired)
  - discovery_started_at
  - selected_driver_id (nullable)
  - hold_expires_at (nullable)
  - qr_token_jti
  - created_at, updated_at
```

### Ride Offer
```
ride_offers:
  - id
  - ride_session_id
  - driver_user_id
  - offer_type (accept | counter)
  - offer_amount
  - price_label (good_deal | normal | pricier)
  - status (pending | selected | rejected | expired)
  - created_at
```

### Indexing Requirements
- Index `ride_sessions.status`
- Index `ride_sessions.rider_user_id`, `ride_sessions.guest_token_id`
- Index `ride_offers.ride_session_id`
- Unique constraint on `qr_token_jti`

---

## 23) Tech Stack

### Frontend (Rider App)
- **Framework:** Expo / React Native
- **State:** Zustand or similar
- **Maps:** Google Maps (react-native-maps)
- **QR:** expo-barcode-scanner (for future), QR generation library

### Backend
- **Platform:** Supabase
  - Postgres database
  - Supabase Auth
  - Supabase Realtime (for instant updates)
  - Edge Functions (for business logic)
- **Token Service:** JWT generation/validation via Edge Functions
- **Cache:** Supabase/Postgres or Redis for token revocation

### Real-Time
- **Supabase Realtime** for:
  - Driver offer notifications
  - Ride status updates
  - Hold/confirmation state changes

### Admin Dashboard
- **Retool or Appsmith** for MVP
- Driver approvals, verification, pricing config, support queue

### Analytics & Monitoring
- **Analytics:** PostHog (self-hosted)
- **Error Tracking:** Sentry
- **Push:** Expo Push Notifications

---

## 24) APIs & Integrations

### Maps Provider (Google Maps)
- Places Autocomplete
- Directions API
- Reverse Geocoding (optional)

### Notifications
- Expo Push Notifications
- Deep link handling via expo-linking

### External
- WhatsApp OTP (for driver app, via Twilio or similar)
- SMS OTP (for rider app, via Twilio or similar)

---

## 25) Screens (MVP Rider App)

1. **Home Map**
   - Clean map with rider location
   - "Where to?" input
   - Quick zone chips (Airport, Cruise Port, Maho)

2. **Route & Estimate**
   - Origin/destination inputs
   - Rora Fare display (single number)
   - Disclaimer (once per session)
   - "Generate QR" button

3. **QR Session**
   - QR code display (cached offline)
   - "Look for drivers" button
   - Session summary

4. **Discovery**
   - Animated progress ("Finding drivers...")
   - "Expand search" prompt when appropriate

5. **Offers List**
   - Top 3 offers + expandable
   - Price context labels
   - Driver summary per offer
   - "Select" action

6. **Hold / Confirmation**
   - Selected driver summary
   - "Waiting for driver..."
   - In-person scan override prompt (if applicable)

7. **Active Ride**
   - Ride in progress status
   - Driver info
   - Agreed fare

8. **Completion Summary**
   - Route, fare, driver name
   - "Done" button

9. **Drivers Directory**
   - Filters (collapsed by default)
   - Driver cards list
   - Search

10. **Driver Profile**
    - Photo, name, badges
    - Capacity, languages, service areas
    - Contact info (if opted in)
    - "Request this driver" or "Not accepting requests"
    - "Favorite" action

11. **Ride History**
    - List view (minimal)
    - Tap for detail

12. **Ride Detail**
    - Full info
    - "Favorite driver" action
    - "Report Issue" action

13. **Favorites**
    - Favorited drivers list
    - Tap for profile

14. **Profile / Settings**
    - Account info
    - Logout
    - Support link

15. **Authentication**
    - Phone/SMS OTP (default)
    - Email magic link (secondary)
    - Switch method option

---

## 26) Edge Cases & Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Location permission denied | App works; show persistent prompt; manual origin entry |
| POI not found | Prompt pin drop + freeform name |
| Network loss during QR display | QR cached; display works offline |
| Network loss during discovery | Discovery pauses; resumes on reconnect |
| No drivers respond | After exhaustion, show "No drivers available" |
| Multiple drivers scan same QR | First redemption wins (for non-bidding); others see "Already claimed" |
| Driver goes offline during hold | 5-minute timeout; rider can select fallback |
| In-person scan conflicts with remote selection | Rider prompted to choose |
| Rider closes app during discovery | Discovery continues; push notifications sent |
| Hold expires | Auto-release; rider can pick another or regenerate |
| Guest token expires | Guest history unrecoverable; prompt signup earlier |

---

## 27) Analytics Events

Track:
- `estimate_created`
- `qr_generated`
- `discovery_started`
- `discovery_expanded`
- `offer_received`
- `offer_selected`
- `hold_timeout`
- `ride_confirmed`
- `ride_completed`
- `ride_canceled`
- `direct_request_sent`
- `direct_request_escalated`
- `driver_profile_viewed`
- `driver_favorited`
- `rating_submitted`
- `issue_reported`
- `guest_claim_prompt_shown`
- `guest_history_claimed`
- `filter_applied`

---

## 28) Rollout Plan

### Phase 1: Private Pilot (Invite-Only)
- 10-30 drivers
- 3 fixed-fare zones (Airport, Cruise, Maho)
- Internal testing + trusted testers

### Phase 2: Soft Launch
- Driver self-signup (admin approval required)
- Directory marketing at hotspots
- QR signage at key locations

### Phase 3: Public Launch
- Open rider access
- Expand zones gradually
- Introduce Rora Pro

---

## 29) Acceptance Criteria

### Core Loop
- [ ] Rider can create estimate and see Rora Fare
- [ ] Rider can generate QR and initiate discovery
- [ ] Drivers can respond with Accept/Counter
- [ ] Rider sees offers with price labels
- [ ] Rider can select driver and enter hold
- [ ] Hold timeout works correctly (5 min)
- [ ] Ride can progress to active and complete
- [ ] Completion shows summary screen

### Discovery
- [ ] Discovery continues in background
- [ ] Push notifications for offers work
- [ ] 10-minute reminder push works
- [ ] Expand search escalation works
- [ ] Service area tag priority works

### Direct Request
- [ ] Direct request from profile works
- [ ] Escalation to broadcast works
- [ ] "Not accepting requests" displays correctly

### Guest Mode
- [ ] Guest can complete ride without account
- [ ] Guest prompted to claim history after completion
- [ ] Guest rides migrate on signup

### Directory
- [ ] Filters work correctly
- [ ] Driver profiles display all info
- [ ] Favorites work and create Wave 0 priority

### Ratings & Reporting
- [ ] Rating prompt appears after completion
- [ ] Rating is optional
- [ ] Report issue creates admin ticket
- [ ] Driver not notified of report

---

## 30) Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Driver adoption friction | Respect cash + negotiation norms; pilot with trusted drivers |
| Pricing disputes | Store breakdown + versioned rules; disclaimers; price context labels |
| Push notification unreliability | In-app inbox fallback; polling when foregrounded |
| Poor POI coverage | Pin + freeform name fallback |
| Guest history loss | 30-day TTL; prompt signup early and often |
| Discovery exhaustion in sparse areas | Clear messaging; no false promises |

---

## 31) Resolved Decisions

| Question | Decision |
|----------|----------|
| First-scan-wins vs bidding | Multi-driver offers with rider selection |
| Bid visibility | Blind bidding (drivers don't see other offers) |
| Counter-offer rules | Any price allowed (higher or lower); price labels inform rider |
| Driver auth | WhatsApp OTP primary, SMS fallback (driver app) |
| Rider auth | SMS OTP primary, email magic link secondary |
| Device ID | Server-generated guest token |
| QR payload | Hybrid (session_id + route summary) |
| Zone geometry | Radius circles |
| Fare display | Single number, no breakdown shown |
| Hold timeout | 5 minutes, no visible timer |
| In-person scan override | Rider chooses |
| Ratings | Rider-only, aggregated, threshold before display |
| Report visibility | Driver notified only if admin acts |
| Admin dashboard | Retool/Appsmith |
| Realtime | Supabase Realtime |
| Analytics | PostHog (self-hosted) |
| Error tracking | Sentry |
| Localization | English only for MVP |
| Dark mode | Light mode only for MVP |

---

## 32) Future Enhancements (Parking Lot)

- In-app payments + receipts
- Scheduled rides
- Live driver availability on map
- Live ride tracking
- Multi-language support
- Dark mode
- Driver ratings of riders (mutual)
- Partnerships (hotels, excursions)
- Multi-island expansion (Anguilla, St Barths)
- Government aggregate reporting exports
- Advanced Rora Pro benefits (analytics, visibility boost)

---

## Appendix A: Price Label Thresholds

Default configuration (admin-adjustable per region):

| Label | Condition |
|-------|-----------|
| Good deal | Offer ≤ Rora Fare × 0.80 |
| *(normal)* | Rora Fare × 0.80 < Offer < Rora Fare × 1.30 |
| Pricier than usual | Offer ≥ Rora Fare × 1.30 |

---

## Appendix B: Discovery Wave Configuration

Default for Sint Maarten (admin-configurable):

| Wave | Radius | Delay Before Escalation |
|------|--------|------------------------|
| 0 | Favorited drivers | Immediate |
| 1 | 2 km (tag priority) | 10 min |
| 2 | 5 km | 10 min |
| 3 | 10 km | 10 min |
| Exhaustion | — | 45-60 min total |

---

## Appendix C: MVP Zones (Sint Maarten)

| Zone | Center | Radius |
|------|--------|--------|
| PJIAE Airport | 18.0410, -63.1089 | 500m |
| Philipsburg Cruise Port | 18.0237, -63.0458 | 400m |
| Maho Beach District | 18.0384, -63.1156 | 600m |

---

*End of Specification*
