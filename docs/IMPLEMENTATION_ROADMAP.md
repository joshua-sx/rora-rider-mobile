# RORA Implementation Roadmap

**Date:** January 30, 2026  
**Status:** Active Planning  
**Author:** Claude (with human review)

---

## Executive Summary

RORA is a ride discovery app for Caribbean tourists. The codebase has **significant infrastructure built** but needs **focused work to become shippable**. This document outlines what's done, what's critical, and a pragmatic path to MVP.

---

## 1. Current State Assessment

### What's Built (Foundation Layer) ✅

| Component | Status | Notes |
|-----------|--------|-------|
| **Database Schema** | 95% | 6 migrations covering regions, users, pricing, rides, drivers, notifications |
| **Edge Functions** | 80% | 14 functions for core ride flow |
| **Client Services** | 70% | rides, pricing, google-maps, qr-token, drivers services |
| **UI Components** | 60% | Design system, primitives, common components |
| **App Screens** | 40% | Tab structure, explore, drivers, profile screens exist |
| **Zustand Stores** | 70% | auth, location, route, favorites, trip-history, saved-locations |

### What's Missing (Critical for MVP)

| Component | Gap | Impact |
|-----------|-----|--------|
| **State Machine** | Missing `arrived` state | QR scan flow broken |
| **Realtime** | Using Postgres Changes (slow) | Poor UX during discovery |
| **Core Ride UI** | No discovery/offers/active ride screens | Can't complete a ride |
| **Driver Notifications** | Partially implemented | Drivers won't see requests |
| **QR Geofencing** | Not implemented | Security vulnerability |
| **Background Jobs** | None | Timeouts don't work |

---

## 2. Thought Process: Why This Order?

### Principle 1: Ship the Core Loop First

The **minimum viable product** is: Rider creates ride → Driver sees request → Driver makes offer → Rider accepts → Ride completes.

Everything else (ratings, reports, admin dashboard, advanced discovery waves) is secondary. We need **one complete path through the app** before optimizing.

### Principle 2: Backend Before Frontend

UI without working backend creates technical debt. When you build screens that call mock APIs, you inevitably:
1. Design around imaginary constraints
2. Miss edge cases the real API surfaces
3. Have to rewrite when connecting to real backend

So: **Fix backend gaps → Build UI that uses real APIs → Polish UX**.

### Principle 3: Pragmatic Security

The spec calls for PostGIS geofencing, but:
- PostGIS requires schema migration
- Haversine calculation works fine for 500m check
- We can add PostGIS later for zone pricing

**Decision:** Use haversine for MVP, PostGIS in Phase 2.

### Principle 4: Realtime Can Wait (Slightly)

The spec says use Broadcast, not Postgres Changes. But:
- Postgres Changes works for low volume
- MVP won't have 1000 concurrent rides
- Migration is medium effort

**Decision:** Keep Postgres Changes for MVP, migrate to Broadcast in Phase 2.

---

## 3. Implementation Phases

### Phase 0: Critical Backend Fixes (3-5 days)
**Goal:** Make the state machine spec-compliant

| Task | Priority | Effort | Files |
|------|----------|--------|-------|
| Add `arrived` state to enum | P0 | Low | New migration |
| Create `mark-driver-arrived` Edge Function | P0 | Medium | New function |
| Update `claim-qr-token` to require `arrived` state | P0 | Low | Existing function |
| Update `activate-ride` to transition from `arrived` | P0 | Low | Existing function |
| Add haversine geofence check to QR claim | P0 | Medium | Existing function |
| Add `expires_at` to ride_offers + set on creation | P0 | Low | Migration + function |
| Update client `rides.service.ts` with missing methods | P0 | Medium | Existing service |

**Why First:** Without correct state machine, no ride can complete properly.

### Phase 1: Core Ride UI (5-7 days)
**Goal:** Complete screens for the happy path

| Screen | Priority | Effort | Exists? |
|--------|----------|--------|---------|
| `HomeMapScreen` (with "Where to?" input) | P0 | Medium | Partial (index.tsx) |
| `RouteEstimateScreen` (fare preview + Generate QR) | P0 | Medium | Partial (trip-preview.tsx) |
| `QRSessionScreen` (display QR + Look for drivers) | P0 | Medium | No |
| `DiscoveryScreen` (animated "Finding drivers...") | P0 | Medium | No |
| `OffersListScreen` (view + accept offers) | P0 | High | Partial (offers.tsx) |
| `HoldConfirmationScreen` (waiting for driver) | P0 | Medium | No |
| `ActiveRideScreen` (ride in progress) | P0 | Medium | No |
| `CompletionSummaryScreen` (fare + rating prompt) | P1 | Medium | No |

**Why Second:** Backend is useless without UI to drive it.

### Phase 2: Realtime & Polish (3-5 days)
**Goal:** Make the experience feel responsive

| Task | Priority | Effort |
|------|----------|--------|
| Add realtime subscription to DiscoveryScreen | P0 | Medium |
| Add realtime subscription to HoldConfirmationScreen | P0 | Medium |
| Add realtime subscription to ActiveRideScreen | P1 | Low |
| Implement offer expiration display (countdown) | P1 | Low |
| Add pull-to-refresh on offers list | P1 | Low |
| Add loading states and skeletons | P1 | Medium |

### Phase 3: Guest Mode & Auth (2-3 days)
**Goal:** Allow unauthenticated usage

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Guest token creation flow | P0 | Low | Exists |
| Attach guest token to API requests | P0 | Low | Partial |
| Guest claim prompt after first ride | P1 | Medium | Component exists |
| Guest-to-authenticated migration | P1 | Medium | Edge function exists |
| Rate limiting for guests (5 QR/hour) | P1 | Medium | Not started |

### Phase 4: Driver Notifications (2-3 days)
**Goal:** Drivers actually receive ride requests

| Task | Priority | Effort |
|------|----------|--------|
| Verify push notification setup (Expo) | P0 | Low |
| Test `start-discovery` sends notifications | P0 | Medium |
| Add inbox notification UI for drivers | P1 | Medium |
| Test end-to-end: rider creates → driver receives | P0 | Medium |

### Phase 5: Background Jobs (2-3 days)
**Goal:** Timeouts work automatically

| Task | Priority | Effort |
|------|----------|--------|
| Implement hold timeout (60s → return to discovery) | P0 | Medium |
| Implement offer expiration (2 min TTL) | P1 | Medium |
| Implement discovery timeout (90s → expired) | P1 | Medium |
| Decide: pg_cron vs external scheduler | P0 | Low (decision) |

### Phase 6: Testing & QA (3-5 days)
**Goal:** Confidence the app works

| Task | Priority | Effort |
|------|----------|--------|
| Manual E2E test: full ride flow | P0 | High |
| Manual E2E test: cancellation at each state | P0 | Medium |
| Manual E2E test: guest mode full flow | P0 | Medium |
| Fix bugs discovered | P0 | Variable |
| Type check: `npx tsc --noEmit` | P0 | Low |
| Lint check: `npm run lint` | P1 | Low |

---

## 4. Detailed Phase 0 Breakdown

Since Phase 0 is the critical path, here's the exact work:

### 4.1 Migration: Add `arrived` State

```sql
-- File: supabase/migrations/20260131000001_add_arrived_state.sql

-- Add 'arrived' state to ride_status enum
ALTER TYPE public.ride_status ADD VALUE 'arrived' AFTER 'confirmed';

-- Add arrived_at timestamp column
ALTER TABLE public.ride_sessions ADD COLUMN arrived_at TIMESTAMPTZ;

COMMENT ON COLUMN public.ride_sessions.arrived_at IS 'Timestamp when driver marked arrival at pickup';
```

### 4.2 New Edge Function: `mark-driver-arrived`

```
supabase/functions/mark-driver-arrived/index.ts
```

Flow:
1. Authenticate driver
2. Validate driver is `selected_driver_id`
3. Validate ride is in `confirmed` state
4. Update status to `arrived`, set `arrived_at`
5. Log event to `ride_events`
6. Notify rider: "Your driver has arrived!"
7. Return success

### 4.3 Update `claim-qr-token`

Change allowed states from `['hold', 'confirmed']` to `['arrived']`.

Add haversine geofence check:
```typescript
// After validating driver is selected driver
const distance = haversineDistance(
  driverProfile.current_lat, driverProfile.current_lng,
  rideSession.origin_lat, rideSession.origin_lng
)

if (distance > 500) { // meters
  return error('GEOFENCE_VIOLATION')
}
```

### 4.4 Update `activate-ride`

Change expected state from `confirmed` to `arrived`.

### 4.5 Migration: Add `expires_at` to offers

```sql
-- File: supabase/migrations/20260131000002_add_offer_expires_at.sql

ALTER TABLE public.ride_offers ADD COLUMN expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.ride_offers.expires_at IS 'Offer expires 2 minutes after creation';
```

### 4.6 Update `rides.service.ts`

Add missing methods:
- `selectOffer(rideSessionId, offerId)` → calls `select-offer`
- `cancelRide(rideSessionId, reason?)` → calls `cancel-ride`
- `markDriverArrived(rideSessionId)` → calls `mark-driver-arrived` (for driver app, but needed for testing)

---

## 5. Decisions Needed

Before starting implementation, confirm:

### 5.1 Arrived State Trigger

**Options:**
1. Manual: Driver clicks "I've arrived" button
2. Automatic: Geofence detection when driver enters 100m radius
3. Both: Auto-detect + manual override

**Recommendation:** Option 1 (Manual) for MVP. Automatic requires continuous location tracking which is battery-intensive and complex.

### 5.2 Background Jobs Implementation

**Options:**
1. pg_cron (Postgres extension) - runs inside database
2. Supabase Cron (if using Supabase cloud)
3. External scheduler (GitHub Actions, Render cron)
4. Self-scheduling Edge Functions (call themselves with delay)

**Recommendation:** pg_cron if available, otherwise Supabase Cron. Keeps everything in one place.

### 5.3 PostGIS Now or Later?

**Recommendation:** Later. Haversine is sufficient for:
- 500m geofence check
- Discovery wave radius calculations

PostGIS adds value for:
- Complex zone polygons (not circles)
- Spatial indexing at scale

---

## 6. Success Metrics

### MVP Definition

The app is MVP-ready when:

- [ ] Rider can create a ride from current location to destination
- [ ] Rider sees Rora Fare estimate
- [ ] Rider can generate and display QR code
- [ ] Discovery broadcasts to at least demo drivers
- [ ] Rider can see offers from drivers
- [ ] Rider can accept an offer
- [ ] Driver can confirm and mark arrival
- [ ] QR scan validates and activates ride
- [ ] Driver can complete ride
- [ ] Rider sees completion summary
- [ ] Guest mode works (no login required)
- [ ] Cancellation works at all allowed states

### What's NOT in MVP

- Ratings and reviews
- Reports and safety features
- Advanced discovery waves (Wave 2, Wave 3)
- Admin dashboard
- Driver app (use Supabase dashboard or manual testing)
- Payment integration
- Advanced analytics

---

## 7. Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Backend Fixes | 3-5 days | Week 1 |
| Phase 1: Core Ride UI | 5-7 days | Week 2 |
| Phase 2: Realtime & Polish | 3-5 days | Week 3 |
| Phase 3: Guest Mode & Auth | 2-3 days | Week 3-4 |
| Phase 4: Driver Notifications | 2-3 days | Week 4 |
| Phase 5: Background Jobs | 2-3 days | Week 4 |
| Phase 6: Testing & QA | 3-5 days | Week 5 |

**Total: ~4-5 weeks to MVP**

---

## 8. Immediate Next Steps

1. **Confirm decisions** (5.1, 5.2, 5.3 above)
2. **Start Phase 0**: Create migration for `arrived` state
3. **Create `mark-driver-arrived` Edge Function**
4. **Update `claim-qr-token` with geofence check**
5. **Update `rides.service.ts` with missing methods**

---

## Appendix: File Reference

### Backend (Supabase)

```
supabase/
├── migrations/
│   ├── 20260104000000_setup_regions_and_users.sql ✅
│   ├── 20260104010000_setup_pricing.sql ✅
│   ├── 20260104020000_setup_rides.sql ✅
│   ├── 20260104030000_setup_drivers_and_social.sql ✅
│   ├── 20260104040000_setup_notifications.sql ✅
│   ├── 20260124000000_add_qr_claim_fields.sql ✅
│   ├── 20260131000001_add_arrived_state.sql 🆕
│   └── 20260131000002_add_offer_expires_at.sql 🆕
└── functions/
    ├── _shared/jwt-helpers.ts ✅
    ├── activate-ride/ ✅ (needs update)
    ├── calculate-fare/ ✅
    ├── cancel-ride/ ✅
    ├── claim-qr-token/ ✅ (needs update)
    ├── complete-ride/ ✅
    ├── confirm-ride-as-driver/ ✅
    ├── create-guest-token/ ✅
    ├── create-ride-session/ ✅
    ├── mark-driver-arrived/ 🆕
    ├── migrate-guest-rides/ ✅
    ├── seed-demo-drivers/ ✅
    ├── select-offer/ ✅
    ├── start-discovery/ ✅
    └── validate-guest-token/ ✅
```

### Frontend (React Native)

```
src/
├── services/
│   ├── rides.service.ts ✅ (needs updates)
│   ├── pricing.service.ts ✅
│   ├── google-maps.service.ts ✅
│   ├── qr-token.service.ts ✅
│   └── realtime.service.ts 🆕
├── features/ride/
│   ├── screens/
│   │   ├── HomeMapScreen.tsx ✅
│   │   ├── RouteEstimateScreen.tsx 🆕 (or update trip-preview)
│   │   ├── QRSessionScreen.tsx 🆕
│   │   ├── DiscoveryScreen.tsx 🆕
│   │   ├── OffersListScreen.tsx 🆕 (or update offers.tsx)
│   │   ├── HoldConfirmationScreen.tsx 🆕
│   │   ├── ActiveRideScreen.tsx 🆕
│   │   └── CompletionSummaryScreen.tsx 🆕
│   └── hooks/
│       ├── useRideSheetState.ts ✅
│       └── useRideRealtime.ts 🆕
└── store/
    ├── ride-store.ts 🆕 (active ride state)
    └── (existing stores) ✅
```

---

*Document created for RORA implementation planning. Review and confirm decisions before proceeding.*
