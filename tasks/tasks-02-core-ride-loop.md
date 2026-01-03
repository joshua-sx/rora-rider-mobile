# tasks-02-core-ride-loop.md

## Spec References
- SPEC: Section 8 (Discovery & Ride Flow)
- SPEC: Section 10 (QR Token System)
- SPEC: Section 11 (Pricing System)
- SPEC: Section 17 (Maps & Location)
- FR-7 to FR-39 (Maps, Pricing, QR, Discovery, Offers, Ride Lifecycle)

## Relevant Files
- `src/features/ride/` - Core ride flow screens and logic
- `src/features/ride/screens/` - Route input, QR, Discovery, Offers screens
- `src/features/ride/components/` - Reusable ride components
- `src/services/pricing.service.ts` - Pricing calculation logic
- `src/services/google-maps.service.ts` - Maps API integration
- `src/services/qr-token.service.ts` - QR generation and validation
- `supabase/functions/calculate-fare/` - Edge Function for pricing
- `supabase/functions/create-ride-session/` - Edge Function for ride creation
- `supabase/functions/start-discovery/` - Edge Function for driver broadcast
- `supabase/functions/handle-offer/` - Edge Function for driver offers

## Notes
- Core loop: Route → Estimate → QR → Discovery → Offers → Select → Hold → Confirm → Active → Complete
- State machine must be enforced (created → discovery → hold → confirmed → active → completed)
- Pricing uses zone-based (if applicable) or distance-based fallback
- QR tokens are JWT with 10-minute expiry
- Discovery runs in background, push notifications for offers
- All state transitions logged to `ride_events`

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/core-ride-loop`

## Phase A: Maps & Location

- [ ] 1.0 Implement Google Maps Integration
  - **Spec refs:** SPEC §17, FR-7, FR-8
  - **Done means:** Maps displayed, origin/destination selection working
  - [ ] 1.1 Install `react-native-maps` and configure for Expo
  - [ ] 1.2 Add Google Maps API key to `.env.local` and app config
  - [ ] 1.3 Create `src/services/google-maps.service.ts`
  - [ ] 1.4 Implement Places Autocomplete API wrapper
  - [ ] 1.5 Implement Directions API wrapper (distance, duration, polyline)
  - [ ] 1.6 Test: search for "Airport", get lat/lng and details
  - [ ] 1.7 Test: calculate route from Airport to Maho Beach

- [ ] 2.0 Build Home Map Screen
  - **Spec refs:** SPEC §25 Screen 1 (Home Map), FR-7
  - **Done means:** Map shows rider location, "Where to?" input, zone chips
  - [ ] 2.1 Create `src/features/ride/screens/HomeMapScreen.tsx`
  - [ ] 2.2 Render map centered on rider's location (or default to Sint Maarten)
  - [ ] 2.3 Request location permission (persistent dismissable prompt if denied)
  - [ ] 2.4 Implement "Use My Location" button (last known + GPS in background)
  - [ ] 2.5 Add "Where to?" search input (opens route builder)
  - [ ] 2.6 Add zone chips: "Airport", "Cruise Port", "Maho" (pre-fill destination)
  - [ ] 2.7 Test: tap chip, verify destination pre-filled

- [ ] 3.0 Build Route & Estimate Screen
  - **Spec refs:** SPEC §25 Screen 2 (Route & Estimate), FR-7, FR-8, FR-10
  - **Done means:** Origin/destination inputs work, estimate calculated, "Generate QR" button
  - [ ] 3.1 Create `src/features/ride/screens/RouteEstimateScreen.tsx`
  - [ ] 3.2 Add origin input (search, pin, "use my location")
  - [ ] 3.3 Add destination input (search, pin, freeform fallback)
  - [ ] 3.4 Implement POI not found fallback: prompt pin drop + optional freeform name
  - [ ] 3.5 On route selected, call pricing API (see Phase B)
  - [ ] 3.6 Display Rora Fare (single number, no breakdown)
  - [ ] 3.7 Show disclaimer once per session: "Final fare may be negotiated" (dismissable)
  - [ ] 3.8 Add "Generate QR" button (navigates to QR screen)
  - [ ] 3.9 Track analytics: `estimate_created`

## Phase B: Pricing Engine

- [ ] 4.0 Seed Initial Pricing Data (Sint Maarten MVP Zones)
  - **Spec refs:** SPEC Appendix C, FR-13, FR-14
  - **Done means:** 3 zones + base pricing rule seeded in database
  - [ ] 4.1 Create migration: `supabase migration create seed_pricing_data`
  - [ ] 4.2 Insert region: `{ country_code: 'SX', island_name: 'Sint Maarten', currency_code: 'USD', ... }`
  - [ ] 4.3 Insert zone: PJIAE Airport (18.0410, -63.1089, radius 500m)
  - [ ] 4.4 Insert zone: Philipsburg Cruise Port (18.0237, -63.0458, radius 400m)
  - [ ] 4.5 Insert zone: Maho Beach District (18.0384, -63.1156, radius 600m)
  - [ ] 4.6 Insert base pricing rule: `{ base_fare: 10, per_km_rate: 2.5, is_active: true }`
  - [ ] 4.7 Insert sample fixed fare: Airport ↔ Maho = $20
  - [ ] 4.8 Apply migration

- [ ] 5.0 Implement Pricing Calculation Logic (Backend)
  - **Spec refs:** FR-11, FR-12, FR-15
  - **Done means:** Edge Function calculates Rora Fare using zone or distance logic
  - [ ] 5.1 Create Edge Function: `supabase functions new calculate-fare`
  - [ ] 5.2 Input: `{ origin: {lat, lng}, destination: {lat, lng}, region_id }`
  - [ ] 5.3 Check if origin or destination is in a zone (point-in-circle check)
  - [ ] 5.4 If zone match exists, query `pricing_fixed_fares` for zone-to-zone or zone-to-any rule
  - [ ] 5.5 If no zone rule, fall back to distance-based: fetch route from Google Directions API
  - [ ] 5.6 Apply modifiers (night/peak) if enabled for region (check time of day)
  - [ ] 5.7 Return: `{ amount, pricing_rule_version_id, calculation_metadata (JSON breakdown) }`
  - [ ] 5.8 Test: Airport → Maho (zone rule), random route (distance-based), night modifier

- [ ] 6.0 Implement Offline Pricing Fallback
  - **Spec refs:** FR-9, NFR-6
  - **Done means:** App calculates estimate using haversine when offline
  - [ ] 6.1 Add offline detection in app: `NetInfo.addEventListener`
  - [ ] 6.2 If offline, calculate haversine distance in `src/utils/geo.ts`
  - [ ] 6.3 Multiply by configurable factor (default 1.3) from `pricing_rule_versions.haversine_multiplier`
  - [ ] 6.4 Use base fare + (distance × per_km_rate)
  - [ ] 6.5 Display "Offline estimate" disclaimer
  - [ ] 6.6 Test: airplane mode, create estimate, verify fallback used

## Phase C: QR Token System

- [ ] 7.0 Implement QR Token Generation (Backend)
  - **Spec refs:** FR-17, FR-18, NFR-2
  - **Done means:** Edge Function generates signed JWT for ride session
  - [ ] 7.1 Create Edge Function: `supabase functions new create-ride-session`
  - [ ] 7.2 Input: `{ origin, destination, rora_fare_amount, pricing_metadata, rider_user_id or guest_token_id }`
  - [ ] 7.3 Insert into `ride_sessions` table (status = 'created')
  - [ ] 7.4 Generate JWT with claims: `{ session_id, created_at, nonce, region_id, jti, exp: 10min }`
  - [ ] 7.5 Sign JWT with secret (from env var)
  - [ ] 7.6 Store `qr_token_jti` in `ride_sessions`
  - [ ] 7.7 Return: `{ ride_session_id, qr_token (JWT), origin_label, dest_label }`
  - [ ] 7.8 Track analytics: `qr_generated`

- [ ] 8.0 Build QR Session Screen (UI)
  - **Spec refs:** SPEC §25 Screen 3 (QR Session), FR-17, FR-19
  - **Done means:** QR code displayed, cached for offline, "Look for drivers" button
  - [ ] 8.1 Create `src/features/ride/screens/QRSessionScreen.tsx`
  - [ ] 8.2 Install QR code library: `npm install react-native-qrcode-svg`
  - [ ] 8.3 Display QR code encoding JWT token
  - [ ] 8.4 Cache QR token + session data in AsyncStorage for offline display
  - [ ] 8.5 Show session summary: origin → destination, Rora Fare
  - [ ] 8.6 Add "Look for drivers" button (starts discovery)
  - [ ] 8.7 Add "Cancel" button (marks session as canceled)
  - [ ] 8.8 Test: generate QR, verify it displays, test offline display

## Phase D: Discovery & Driver Broadcast

- [ ] 9.0 Implement Discovery Wave Logic (Backend)
  - **Spec refs:** SPEC §8 (Discovery Escalation), FR-20, FR-21, FR-22
  - **Done means:** Edge Function broadcasts to drivers in waves, favorited first
  - [ ] 9.1 Create Edge Function: `supabase functions new start-discovery`
  - [ ] 9.2 Input: `{ ride_session_id }`
  - [ ] 9.3 Update ride_session status: `created → discovery`
  - [ ] 9.4 Log event: `ride_events.insert({ session_id, event: 'discovery_started' })`
  - [ ] 9.5 **Wave 0:** Query favorited drivers (from `favorites` table where rider_user_id matches)
  - [ ] 9.6 **Wave 1:** Query nearby drivers within Wave 1 radius (from `regions.discovery_radius_config`)
  - [ ] 9.7 Filter Wave 1 by matching service area tags (if origin/dest is Airport, prioritize 'airport' tag)
  - [ ] 9.8 For each driver, insert notification (push + inbox) with ride details
  - [ ] 9.9 Return: `{ notified_driver_count }`
  - [ ] 9.10 Track analytics: `discovery_started`

- [ ] 10.0 Implement Discovery Expansion (Backend Job)
  - **Spec refs:** SPEC §8 (Wave 2+), FR-20
  - **Done means:** Background job expands discovery radius after 10 min if no offers
  - [ ] 10.1 Create Edge Function or pg_cron job: `expand-discovery-wave`
  - [ ] 10.2 Query `ride_sessions` where status = 'discovery' and `discovery_started_at < now() - 10 minutes`
  - [ ] 10.3 Check if any `ride_offers` exist for session
  - [ ] 10.4 If no offers, notify rider: "We couldn't find a nearby driver yet. Want us to look farther out?"
  - [ ] 10.5 If rider confirms expansion, increment wave and notify next batch of drivers
  - [ ] 10.6 Repeat for Wave 3 after another 10 min
  - [ ] 10.7 After exhaustion (~45-60 min total), notify rider: "No drivers available right now."
  - [ ] 10.8 Test: mock no driver responses, verify escalation prompts

- [ ] 11.0 Build Discovery Screen (UI)
  - **Spec refs:** SPEC §19 (Discovery UX), §25 Screen 4, FR-22
  - **Done means:** Animated progress, "Expand search" prompt, real-time offer updates
  - [ ] 11.1 Create `src/features/ride/screens/DiscoveryScreen.tsx`
  - [ ] 11.2 Show rotating status text animation: "Finding drivers" → "Checking availability" → etc.
  - [ ] 11.3 Subscribe to Supabase Realtime for `ride_offers` where `ride_session_id` matches
  - [ ] 11.4 On offer received, navigate to Offers List screen
  - [ ] 11.5 Show "Expand search" prompt when backend sends it
  - [ ] 11.6 Add "Cancel" button (marks session as canceled)
  - [ ] 11.7 Test: start discovery, receive offer, verify navigation

## Phase E: Offers & Selection

- [ ] 12.0 Implement Driver Offer Submission (Backend)
  - **Spec refs:** FR-24, FR-25, FR-26
  - **Done means:** Edge Function accepts driver Accept/Counter, applies price labels
  - [ ] 12.1 Create Edge Function: `supabase functions new submit-offer`
  - [ ] 12.2 Input: `{ ride_session_id, driver_user_id, offer_type: 'accept' | 'counter', offer_amount (if counter) }`
  - [ ] 12.3 Validate session is in 'discovery' state
  - [ ] 12.4 Insert into `ride_offers` table
  - [ ] 12.5 Calculate price label: compare `offer_amount` vs `rora_fare_amount` using thresholds (±20%, ±30%)
  - [ ] 12.6 Store price_label: 'good_deal' | 'normal' | 'pricier'
  - [ ] 12.7 Notify rider via push + inbox: "A driver accepted/countered your ride"
  - [ ] 12.8 Track analytics: `offer_received`
  - [ ] 12.9 Test: submit Accept offer, Counter offer, verify price labels

- [ ] 13.0 Build Offers List Screen (UI)
  - **Spec refs:** SPEC §25 Screen 5 (Offers List), FR-24, FR-25, FR-26
  - **Done means:** Top 3 offers displayed, price labels shown, expandable list
  - [ ] 13.1 Create `src/features/ride/screens/OffersListScreen.tsx`
  - [ ] 13.2 Subscribe to `ride_offers` via Realtime
  - [ ] 13.3 Sort offers by price (ascending)
  - [ ] 13.4 Display top 3 offers prominently
  - [ ] 13.5 Show "+ X more offers" expandable section
  - [ ] 13.6 For each offer, show: price, driver name, photo, badges (verification, Rora Pro), distance
  - [ ] 13.7 Display price labels: "Good deal" (green), "Pricier than usual" (yellow), or none
  - [ ] 13.8 Add "Select" button per offer
  - [ ] 13.9 Test: receive multiple offers, verify display, price labels, sorting

- [ ] 14.0 Implement Offer Selection & Hold Logic (Backend)
  - **Spec refs:** FR-27, FR-28, FR-29
  - **Done means:** Rider selects offer, session enters hold, 5-min timeout enforced
  - [ ] 14.1 Create Edge Function: `supabase functions new select-offer`
  - [ ] 14.2 Input: `{ ride_session_id, offer_id }`
  - [ ] 14.3 Validate session is in 'discovery' state
  - [ ] 14.4 Update session: status = 'hold', selected_driver_id = offer.driver_user_id, hold_expires_at = now() + 5 min
  - [ ] 14.5 Update selected offer: status = 'selected'
  - [ ] 14.6 Update other offers: status = 'rejected'
  - [ ] 14.7 Notify selected driver: "Rider selected your offer. Please confirm."
  - [ ] 14.8 Notify other drivers: "Rider chose another driver."
  - [ ] 14.9 Log event: `ride_events.insert({ event: 'offer_selected' })`
  - [ ] 14.10 Track analytics: `offer_selected`

- [ ] 15.0 Implement Hold Timeout & Fallback (Backend Job)
  - **Spec refs:** FR-28, FR-29
  - **Done means:** After 5 min, hold auto-releases, rider can select fallback
  - [ ] 15.1 Create pg_cron job or Edge Function: `process-hold-timeouts`
  - [ ] 15.2 Query sessions where status = 'hold' and `hold_expires_at < now()`
  - [ ] 15.3 Reset session: status = 'discovery', selected_driver_id = null, hold_expires_at = null
  - [ ] 15.4 Notify rider: "Driver didn't respond. You can select another offer."
  - [ ] 15.5 Update timed-out offer: status = 'expired'
  - [ ] 15.6 Log event: `hold_timeout`
  - [ ] 15.7 Track analytics: `hold_timeout`

- [ ] 16.0 Build Hold / Confirmation Screen (UI)
  - **Spec refs:** SPEC §25 Screen 6 (Hold / Confirmation), FR-30
  - **Done means:** Shows selected driver, "Waiting for driver...", in-person scan override prompt
  - [ ] 16.1 Create `src/features/ride/screens/HoldConfirmationScreen.tsx`
  - [ ] 16.2 Display selected driver info: name, photo, badges, agreed fare
  - [ ] 16.3 Show status: "Waiting for driver..." (no visible countdown timer)
  - [ ] 16.4 Subscribe to session status changes via Realtime
  - [ ] 16.5 If hold times out, show fallback offers list
  - [ ] 16.6 If driver scans in person while hold active (detect via Realtime event), show override prompt
  - [ ] 16.7 Override prompt: "A driver is here in person. Switch to them?" with Yes/No buttons
  - [ ] 16.8 Test: select offer, wait for timeout, verify fallback works
  - [ ] 16.9 Test: in-person scan override scenario (requires driver app integration, mock for now)

## Phase F: Ride Lifecycle (Confirm → Active → Complete)

- [ ] 17.0 Implement Ride Confirmation (Backend)
  - **Spec refs:** FR-35, FR-36, FR-37
  - **Done means:** Rider confirms driver, session moves to 'confirmed' state
  - [ ] 17.1 Create Edge Function: `supabase functions new confirm-ride`
  - [ ] 17.2 Input: `{ ride_session_id }`
  - [ ] 17.3 Validate session is in 'hold' state
  - [ ] 17.4 Update session: status = 'confirmed'
  - [ ] 17.5 Notify driver: "Ride confirmed. You can start the trip."
  - [ ] 17.6 Log event: `ride_confirmed`
  - [ ] 17.7 Track analytics: `ride_confirmed`

- [ ] 18.0 Implement Ride Start (Active State)
  - **Spec refs:** FR-35, FR-36, FR-37
  - **Done means:** Driver starts ride, session moves to 'active' state
  - [ ] 18.1 Create Edge Function: `supabase functions new start-ride`
  - [ ] 18.2 Input: `{ ride_session_id }` (called by driver app, mock for now)
  - [ ] 18.3 Validate session is in 'confirmed' state
  - [ ] 18.4 Update session: status = 'active', started_at = now()
  - [ ] 18.5 Notify rider: "Ride started."
  - [ ] 18.6 Log event: `ride_started`
  - [ ] 18.7 Track analytics: `ride_started`

- [ ] 19.0 Build Active Ride Screen (UI)
  - **Spec refs:** SPEC §25 Screen 7 (Active Ride)
  - **Done means:** Shows ride in progress, driver info, agreed fare
  - [ ] 19.1 Create `src/features/ride/screens/ActiveRideScreen.tsx`
  - [ ] 19.2 Display driver info, agreed fare, route summary
  - [ ] 19.3 Show status: "Ride in progress"
  - [ ] 19.4 Subscribe to session status changes (wait for 'completed')
  - [ ] 19.5 No cancel button (per FR-39: only admin can cancel during active)
  - [ ] 19.6 Test: mock ride start, verify screen displays correctly

- [ ] 20.0 Implement Ride Completion (Backend)
  - **Spec refs:** FR-35, FR-36, FR-37
  - **Done means:** Driver completes ride, session moves to 'completed' state
  - [ ] 20.1 Create Edge Function: `supabase functions new complete-ride`
  - [ ] 20.2 Input: `{ ride_session_id }` (called by driver app, mock for now)
  - [ ] 20.3 Validate session is in 'active' state
  - [ ] 20.4 Update session: status = 'completed', completed_at = now()
  - [ ] 20.5 Notify rider: "Ride completed."
  - [ ] 20.6 Log event: `ride_completed`
  - [ ] 20.7 Track analytics: `ride_completed`
  - [ ] 20.8 Return: `{ ride_session_id }` (for receipt/summary)

- [ ] 21.0 Build Completion Summary Screen (UI)
  - **Spec refs:** SPEC §25 Screen 8 (Completion Summary), FR-48 (Rating prompt)
  - **Done means:** Shows route, fare, driver name, optional rating prompt, "Done" button
  - [ ] 21.1 Create `src/features/ride/screens/CompletionSummaryScreen.tsx`
  - [ ] 21.2 Display route, agreed fare, driver name
  - [ ] 21.3 Add optional rating prompt (1-5 stars, dismissable)
  - [ ] 21.4 Submit rating to backend if user rates (see `tasks-05-ratings.md`)
  - [ ] 21.5 Add "Done" button (returns to home)
  - [ ] 21.6 If guest user + first completed ride, trigger guest claim prompt (see `tasks-01-auth.md`)
  - [ ] 21.7 Test: complete ride, verify summary displays, test rating flow

- [ ] 22.0 Implement Cancellation Logic
  - **Spec refs:** FR-38, FR-39
  - **Done means:** Rider can cancel during discovery/hold, restricted after confirmation
  - [ ] 22.1 Create Edge Function: `supabase functions new cancel-ride`
  - [ ] 22.2 Input: `{ ride_session_id, reason (optional) }`
  - [ ] 22.3 Validate current status allows cancellation (discovery/hold/confirmed)
  - [ ] 22.4 Update session: status = 'canceled', canceled_at = now(), cancel_reason
  - [ ] 22.5 Log event: `ride_canceled` with reason
  - [ ] 22.6 If in hold/confirmed, notify driver: "Rider canceled the ride."
  - [ ] 22.7 Track analytics: `ride_canceled`
  - [ ] 22.8 Test: cancel during discovery, hold, confirmed; verify active cannot be canceled

---

**Next:** After completing core ride loop, proceed to `tasks-03-driver-directory.md`
