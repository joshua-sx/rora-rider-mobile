# tasks-07-testing-qa.md

## Spec References
- SPEC: Section 29 (Acceptance Criteria)
- All FR and NFR requirements

## Relevant Files
- `__tests__/` - Jest tests
- `e2e/` - Detox E2E tests (optional for MVP)
- `supabase/tests/` - Database and Edge Function tests
- `.github/workflows/` - CI pipeline

## Notes
- Focus on integration tests for critical flows
- Test state machine transitions thoroughly
- Test rate limiting and abuse prevention
- Verify RLS policies work correctly
- Do not test external APIs (Google Maps, Twilio) — mock them
- Test both guest and authenticated user flows

## Instructions for Completing Tasks
**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 `git checkout -b feature/testing-and-qa`

## Unit & Integration Tests (Backend)

- [ ] 1.0 Set Up Testing Infrastructure
  - **Spec refs:** NFR-3, NFR-2
  - **Done means:** Jest configured, test database set up, test helpers created
  - [ ] 1.1 Install testing dependencies: `npm install --save-dev jest @supabase/supabase-js`
  - [ ] 1.2 Configure Jest in `jest.config.js`
  - [ ] 1.3 Set up test Supabase instance (local or dedicated test project)
  - [ ] 1.4 Create test data seeders: `__tests__/helpers/seed-data.ts`
  - [ ] 1.5 Create test utilities: `__tests__/helpers/test-utils.ts` (API helpers, mocks)

- [ ] 2.0 Test Pricing Calculation Logic
  - **Spec refs:** FR-11, FR-12, FR-15
  - **Done means:** All pricing scenarios tested (zone, distance, modifiers)
  - [ ] 2.1 Test zone-based pricing: origin in zone → use zone fare
  - [ ] 2.2 Test distance-based pricing: no zone match → base + per_km
  - [ ] 2.3 Test haversine fallback (offline mode)
  - [ ] 2.4 Test night modifier applied (10pm-6am)
  - [ ] 2.5 Test edge case: both origin and destination in zones with zone-to-zone rule
  - [ ] 2.6 Test versioning: old rides use old pricing_rule_version_id

- [ ] 3.0 Test Ride State Machine Transitions
  - **Spec refs:** FR-35, FR-36, FR-37
  - **Done means:** All valid and invalid state transitions tested
  - [ ] 3.1 Test: created → discovery (valid)
  - [ ] 3.2 Test: discovery → hold (valid)
  - [ ] 3.3 Test: hold → confirmed (valid)
  - [ ] 3.4 Test: confirmed → active (valid)
  - [ ] 3.5 Test: active → completed (valid)
  - [ ] 3.6 Test: discovery → completed (invalid, should fail)
  - [ ] 3.7 Test: active → canceled (invalid, should fail)
  - [ ] 3.8 Test: all transitions logged to `ride_events`

- [ ] 4.0 Test QR Token Generation & Validation
  - **Spec refs:** FR-17, FR-18, NFR-2
  - **Done means:** JWT tokens work correctly, expiry enforced, single-use enforced
  - [ ] 4.1 Test: generate QR token, decode JWT, verify claims
  - [ ] 4.2 Test: token expires after 10 minutes
  - [ ] 4.3 Test: token is single-use (second redemption fails)
  - [ ] 4.4 Test: revoked token cannot be used
  - [ ] 4.5 Test: tampered token signature fails validation

- [ ] 5.0 Test Guest Token System
  - **Spec refs:** FR-1, FR-4, FR-5, FR-6
  - **Done means:** Guest tokens work, TTL enforced, migration works
  - [ ] 5.1 Test: create guest token, verify 30-day expiry set
  - [ ] 5.2 Test: expired guest token rejected
  - [ ] 5.3 Test: guest ride created, linked to guest_token_id
  - [ ] 5.4 Test: user signs up, guest rides migrated to rider_user_id
  - [ ] 5.5 Test: guest_token_id set to null after migration

- [ ] 6.0 Test Rate Limiting
  - **Spec refs:** FR-60, FR-3
  - **Done means:** Rate limits enforced for QR generation and OTP sends
  - [ ] 6.1 Test: guest generates 5 QRs → 6th blocked
  - [ ] 6.2 Test: authenticated user not rate-limited
  - [ ] 6.3 Test: OTP send rate limit (2 retries, 30s cooldown)
  - [ ] 6.4 Test: OTP send rate limit (max 5 per phone per hour)

- [ ] 7.0 Test RLS Policies
  - **Spec refs:** NFR-2 (Security)
  - **Done means:** RLS policies prevent unauthorized access
  - [ ] 7.1 Test: user can only read own `ride_sessions`
  - [ ] 7.2 Test: user can only read own `notifications_inbox`
  - [ ] 7.3 Test: user can only read own `favorites`
  - [ ] 7.4 Test: user cannot read other users' `ratings`
  - [ ] 7.5 Test: admin can read all tables
  - [ ] 7.6 Test: unauthenticated user can read `pricing_zones` and `driver_profiles`

- [ ] 8.0 Test Discovery Wave Logic
  - **Spec refs:** FR-20, FR-21
  - **Done means:** Wave 0 (favorites), Wave 1 (tags), Wave 2+ (expansion) work correctly
  - [ ] 8.1 Test: favorited drivers notified first (Wave 0)
  - [ ] 8.2 Test: drivers with matching service area tag notified in Wave 1
  - [ ] 8.3 Test: Wave 2 expansion after 10 min if no offers
  - [ ] 8.4 Test: discovery exhaustion after 45-60 min

- [ ] 9.0 Test Price Label Calculation
  - **Spec refs:** FR-26
  - **Done means:** Price labels applied correctly based on thresholds
  - [ ] 9.1 Test: offer ≤ Rora Fare - 20% → "good_deal"
  - [ ] 9.2 Test: offer within ±20% to +30% → "normal" (no label)
  - [ ] 9.3 Test: offer ≥ Rora Fare + 30% → "pricier"
  - [ ] 9.4 Test: custom thresholds per region

## UI/UX Tests (Frontend)

- [ ] 10.0 Set Up React Native Testing Library
  - **Spec refs:** General quality
  - **Done means:** Jest + React Native Testing Library configured for component tests
  - [ ] 10.1 Install: `npm install --save-dev @testing-library/react-native`
  - [ ] 10.2 Create test setup file: `__tests__/setup.ts`
  - [ ] 10.3 Mock Expo modules (notifications, location, etc.)
  - [ ] 10.4 Mock Google Maps API responses

- [ ] 11.0 Test Authentication Flows
  - **Spec refs:** FR-2, FR-3
  - **Done means:** Login, OTP, magic link flows tested
  - [ ] 11.1 Test: SMS OTP login happy path
  - [ ] 11.2 Test: email magic link login happy path
  - [ ] 11.3 Test: OTP retry logic (2 retries, fallback shown)
  - [ ] 11.4 Test: toggle between SMS and email methods

- [ ] 12.0 Test Core Ride Loop (Happy Path)
  - **Spec refs:** SPEC §29 Acceptance Criteria (Core Loop)
  - **Done means:** End-to-end happy path works
  - [ ] 12.1 Test: select route → estimate displayed
  - [ ] 12.2 Test: generate QR → QR screen shown
  - [ ] 12.3 Test: start discovery → offers received
  - [ ] 12.4 Test: select offer → hold screen shown
  - [ ] 12.5 Test: confirm driver → active ride
  - [ ] 12.6 Test: complete ride → completion summary

- [ ] 13.0 Test Edge Cases (UI)
  - **Spec refs:** SPEC §26 (Edge Cases & Failure Scenarios)
  - **Done means:** All edge cases handled gracefully
  - [ ] 13.1 Test: location permission denied → app still works, manual entry shown
  - [ ] 13.2 Test: POI not found → pin drop fallback shown
  - [ ] 13.3 Test: network loss during QR display → QR cached, displays offline
  - [ ] 13.4 Test: hold timeout → fallback offers shown
  - [ ] 13.5 Test: in-person scan override → prompt shown
  - [ ] 13.6 Test: rider closes app during discovery → push notification sent, discovery continues

- [ ] 14.0 Test Guest Flow
  - **Spec refs:** SPEC §29 Acceptance Criteria (Guest Mode)
  - **Done means:** Guest can complete ride, claim history
  - [ ] 14.1 Test: guest browses directory (no signup required)
  - [ ] 14.2 Test: guest generates estimate + QR
  - [ ] 14.3 Test: guest completes ride
  - [ ] 14.4 Test: guest claim prompt shown after first ride
  - [ ] 14.5 Test: guest signs up, rides migrated

- [ ] 15.0 Test Direct Driver Request Flow
  - **Spec refs:** SPEC §29 Acceptance Criteria (Direct Request)
  - **Done means:** Direct request from profile works, escalation works
  - [ ] 15.1 Test: tap "Request this driver" → route builder opens
  - [ ] 15.2 Test: direct request sent → only target driver notified
  - [ ] 15.3 Test: no response after 10 min → escalation prompt shown
  - [ ] 15.4 Test: "Not accepting requests" shown if driver disabled

## Performance & Load Tests

- [ ] 16.0 Test Performance Requirements
  - **Spec refs:** NFR-1
  - **Done means:** Estimate screen loads within 2 seconds
  - [ ] 16.1 Measure: route estimate API response time (<2s)
  - [ ] 16.2 Measure: QR generation time (<500ms)
  - [ ] 16.3 Measure: driver directory load time (<3s for 100 drivers)
  - [ ] 16.4 Optimize slow queries if needed

- [ ] 17.0 Test Offline Behavior
  - **Spec refs:** NFR-6
  - **Done means:** QR displayable offline, fare estimate fallback works
  - [ ] 17.1 Test: generate QR online, go offline, verify QR still displays
  - [ ] 17.2 Test: offline estimate calculation (haversine fallback)
  - [ ] 17.3 Test: cached driver profiles browsable offline

## QA Checklists (Manual Testing)

- [ ] 18.0 Execute QA Checklist: Core Ride Loop
  - **Spec refs:** SPEC §29 (Acceptance Criteria)
  - **Done means:** All acceptance criteria manually verified on real devices
  - [ ] 18.1 Rider can create estimate and see Rora Fare ✓
  - [ ] 18.2 Rider can generate QR and initiate discovery ✓
  - [ ] 18.3 Drivers can respond with Accept/Counter ✓ (requires driver app, mock for now)
  - [ ] 18.4 Rider sees offers with price labels ✓
  - [ ] 18.5 Rider can select driver and enter hold ✓
  - [ ] 18.6 Hold timeout works correctly (5 min) ✓
  - [ ] 18.7 Ride can progress to active and complete ✓
  - [ ] 18.8 Completion shows summary screen ✓

- [ ] 19.0 Execute QA Checklist: Discovery
  - **Spec refs:** SPEC §29 (Acceptance Criteria - Discovery)
  - **Done means:** All discovery acceptance criteria verified
  - [ ] 19.1 Discovery continues in background ✓
  - [ ] 19.2 Push notifications for offers work ✓
  - [ ] 19.3 10-minute reminder push works ✓
  - [ ] 19.4 Expand search escalation works ✓
  - [ ] 19.5 Service area tag priority works ✓

- [ ] 20.0 Execute QA Checklist: Directory & Ratings
  - **Spec refs:** SPEC §29 (Acceptance Criteria - Directory, Ratings)
  - **Done means:** Directory and ratings acceptance criteria verified
  - [ ] 20.1 Filters work correctly ✓
  - [ ] 20.2 Driver profiles display all info ✓
  - [ ] 20.3 Favorites work and create Wave 0 priority ✓
  - [ ] 20.4 Rating prompt appears after completion ✓
  - [ ] 20.5 Rating is optional ✓
  - [ ] 20.6 Report issue creates admin ticket ✓
  - [ ] 20.7 Driver not notified of report ✓

## CI/CD Pipeline

- [ ] 21.0 Set Up CI Pipeline
  - **Spec refs:** General quality
  - **Done means:** GitHub Actions runs tests on every PR
  - [ ] 21.1 Create `.github/workflows/ci.yml`
  - [ ] 21.2 Run Jest tests on every PR
  - [ ] 21.3 Run ESLint + TypeScript type checks
  - [ ] 21.4 Run Supabase migrations in test environment
  - [ ] 21.5 Block PR merge if tests fail

---

**Final Step:** After all tests pass, proceed to pilot launch preparation
