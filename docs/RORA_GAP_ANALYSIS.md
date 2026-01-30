# RORA Architecture Gap Analysis

**Date:** January 30, 2026  
**Status:** Draft for Review  
**Scope:** Compare current implementation against architecture specification

---

## Executive Summary

The RORA codebase has a solid foundation with most core tables, Edge Functions, and client services in place. However, there are **critical gaps** in:

1. **State Machine:** Missing `arrived` state (spec has 10 states, current has 8)
2. **PostGIS:** Using simple lat/lng decimals instead of `geography` type
3. **Realtime:** Using Postgres Changes instead of Broadcast channels
4. **QR Geofencing:** Missing 500m proximity validation
5. **Offer TTL:** Missing 2-minute expiration enforcement

This document provides a prioritized implementation plan to align the codebase with the architecture spec.

---

## 1. Database Schema Gaps

### 1.1 Ride Status Enum - Missing `arrived` State

**Spec:**
```
created → discovery → hold → confirmed → arrived → active → completed
                                                     ↓        ↓
                                                  cancelled  cancelled
```

**Current (`20260104020000_setup_rides.sql:10-18`):**
```sql
CREATE TYPE public.ride_status AS ENUM (
  'created', 'discovery', 'hold', 'confirmed', 
  'active', 'completed', 'canceled', 'expired'
);
```

**Gap:** Missing `arrived` state between `confirmed` and `active`.

**Impact:** 
- QR scan currently works in `hold` or `confirmed` states
- Spec requires QR scan ONLY in `arrived` state
- Missing driver arrival notification flow

**Fix Required:**
```sql
-- Migration: Add 'arrived' state to ride_status enum
ALTER TYPE public.ride_status ADD VALUE 'arrived' AFTER 'confirmed';
```

---

### 1.2 PostGIS Geography Columns

**Spec:**
> All location columns use PostGIS `geography` type with GiST indexes  
> `pricing_zones` use ST_Contains for point-in-polygon fare lookup

**Current:**
- Using `DECIMAL(10,8)` for lat/lng columns
- No PostGIS extension enabled
- No GiST indexes on location data

**Tables Affected:**
| Table | Current Columns | Should Be |
|-------|----------------|-----------|
| ride_sessions | `origin_lat`, `origin_lng` | `origin_location geography(Point,4326)` |
| ride_sessions | `destination_lat`, `destination_lng` | `destination_location geography(Point,4326)` |
| driver_profiles | `current_lat`, `current_lng` | `current_location geography(Point,4326)` |
| pricing_zones | `center_lat`, `center_lng`, `radius_meters` | `geofence geography(Polygon,4326)` |

**Impact:**
- Cannot use PostGIS spatial queries (ST_DWithin, ST_Contains)
- 500m QR geofence validation not possible with current schema
- Discovery wave radius calculations are less accurate

**Fix Required:**
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography columns (keep old columns for backward compatibility initially)
ALTER TABLE ride_sessions ADD COLUMN origin_location geography(Point, 4326);
ALTER TABLE ride_sessions ADD COLUMN destination_location geography(Point, 4326);

-- Populate from existing decimal columns
UPDATE ride_sessions SET 
  origin_location = ST_MakePoint(origin_lng, origin_lat)::geography,
  destination_location = ST_MakePoint(destination_lng, destination_lat)::geography;

-- Create GiST indexes
CREATE INDEX idx_ride_sessions_origin_location ON ride_sessions USING GIST(origin_location);
CREATE INDEX idx_ride_sessions_destination_location ON ride_sessions USING GIST(destination_location);
```

---

### 1.3 Ride Events BRIN Index

**Spec:**
> `ride_events` is append-only audit log (BRIN index, no UPDATE/DELETE)

**Current:** Standard B-tree indexes only, no UPDATE/DELETE restrictions.

**Fix Required:**
```sql
-- Add BRIN index for time-series queries
CREATE INDEX CONCURRENTLY idx_ride_events_created_at_brin 
  ON ride_events USING BRIN(created_at);

-- Add trigger to prevent updates/deletes (optional but recommended)
CREATE OR REPLACE FUNCTION prevent_ride_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ride_events is append-only. Updates and deletes are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ride_events_update
  BEFORE UPDATE ON ride_events FOR EACH ROW
  EXECUTE FUNCTION prevent_ride_events_mutation();

CREATE TRIGGER prevent_ride_events_delete
  BEFORE DELETE ON ride_events FOR EACH ROW
  EXECUTE FUNCTION prevent_ride_events_mutation();
```

---

### 1.4 Offer Expiration Fields

**Spec:**
> `ride_offers` have 2-minute TTL, labeled as good_deal/normal/pricier

**Current:**
- `ride_offers` table exists but missing `expires_at` column
- `price_label` enum exists but not being set

**Fix Required:**
```sql
-- Add expires_at column
ALTER TABLE ride_offers ADD COLUMN expires_at TIMESTAMPTZ;

-- Set default to 2 minutes from creation (enforced by Edge Function)
COMMENT ON COLUMN ride_offers.expires_at IS 'Offer expires 2 minutes after creation';
```

---

### 1.5 Guest Token SHA256 Hash

**Spec:**
> `guest_tokens` track anonymous users (SHA256 hash, 5 QR/hour rate limit)

**Current:**
- Using plaintext UUID token
- No rate limit tracking columns

**Fix Required:**
```sql
-- Add rate limit tracking
ALTER TABLE guest_tokens ADD COLUMN qr_scan_count_current_hour INTEGER DEFAULT 0;
ALTER TABLE guest_tokens ADD COLUMN qr_scan_hour_window TIMESTAMPTZ;

-- Add hash column for security (optional - current UUID is reasonably secure)
ALTER TABLE guest_tokens ADD COLUMN token_hash TEXT;
```

---

## 2. Edge Function Gaps

### 2.1 State Machine - Missing `arrived` Transition

**Current Flow:**
```
confirm-ride-as-driver: hold → confirmed
activate-ride: confirmed → active
```

**Required Flow:**
```
confirm-ride-as-driver: hold → confirmed
mark-driver-arrived: confirmed → arrived  (NEW)
claim-qr-token: Only allowed in 'arrived' state
activate-ride: arrived → active
```

**Files to Modify:**
- `supabase/functions/claim-qr-token/index.ts` - Change allowed states from `['hold', 'confirmed']` to `['arrived']`
- **NEW:** `supabase/functions/mark-driver-arrived/index.ts`

---

### 2.2 QR Token - Missing Geofence Validation

**Spec (Step 8):**
> Verify driver within 500m geofence (PostGIS ST_DWithin)

**Current (`claim-qr-token/index.ts`):**
- No geofence validation
- Only validates driver is selected driver

**Fix Required:**
```typescript
// In claim-qr-token/index.ts, after Step 7

// Step 8: Verify driver within 500m geofence
const { data: driverProfile } = await supabaseService
  .from('driver_profiles')
  .select('current_lat, current_lng')
  .eq('id', driverId)
  .single()

if (driverProfile?.current_lat && driverProfile?.current_lng) {
  // Call PostGIS function to check distance
  const { data: withinGeofence } = await supabaseService.rpc('check_within_geofence', {
    driver_lat: driverProfile.current_lat,
    driver_lng: driverProfile.current_lng,
    pickup_lat: rideSession.origin_lat,
    pickup_lng: rideSession.origin_lng,
    max_distance_meters: 500
  })

  if (!withinGeofence) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'GEOFENCE_VIOLATION: Driver must be within 500m of pickup location'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}
```

**Database Function Required:**
```sql
CREATE OR REPLACE FUNCTION check_within_geofence(
  driver_lat DECIMAL,
  driver_lng DECIMAL,
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  max_distance_meters INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN ST_DWithin(
    ST_MakePoint(driver_lng, driver_lat)::geography,
    ST_MakePoint(pickup_lng, pickup_lat)::geography,
    max_distance_meters
  );
END;
$$ LANGUAGE plpgsql;
```

---

### 2.3 Discovery Waves - Incomplete Implementation

**Spec:**
> discovery: 3 waves (favorites → 2km verified → 5km all) over 90 seconds

**Current (`start-discovery/index.ts`):**
- Wave 0 (favorites) and Wave 1 (nearby) implemented
- Missing automatic wave expansion after timeout
- No 90-second total timeout

**Fix Required:**
1. Add scheduled job or background task for wave expansion
2. Implement timeout handling
3. Add `current_wave` and `wave_2_started_at`, `wave_3_started_at` columns

---

### 2.4 Offer Expiration Enforcement

**Spec:**
> Offers expire after 2 minutes from creation

**Current:**
- `select-offer/index.ts` checks `expires_at` but doesn't set it
- No background job to mark expired offers

**Fix Required:**
1. Set `expires_at` on offer creation: `NOW() + INTERVAL '2 minutes'`
2. Add scheduled job to mark expired offers
3. Or use Postgres-level expiration with cron

---

### 2.5 Hold Timeout - Return to Discovery

**Spec:**
> hold: 60-second driver confirmation window, auto-select next offer on timeout

**Current:**
- `confirm-ride-as-driver` checks `hold_expires_at` but doesn't handle timeout
- No auto-return to discovery
- No auto-select next offer

**Fix Required:**
1. Background job to check expired holds
2. Transition back to `discovery` on timeout
3. Auto-select next pending offer if available

---

## 3. Realtime Channel Gaps

### 3.1 Using Postgres Changes vs Broadcast

**Spec:**
> Realtime: Supabase Broadcast (NOT Postgres Changes - for performance)  
> Channels: `ride:{session_id}` and `driver:{driver_id}`

**Current (`rides.service.ts`):**
```typescript
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'ride_offers',
  filter: `ride_session_id=eq.${rideSessionId}`,
})
```

**Issue:** Postgres Changes has higher latency and doesn't scale well.

**Fix Required:**
```typescript
// Use Broadcast channels instead
const channel = supabase.channel(`ride:${rideSessionId}`)
  .on('broadcast', { event: 'new_offer' }, (payload) => {
    onOffer(payload.data as RideOffer)
  })
  .on('broadcast', { event: 'offer_withdrawn' }, (payload) => {
    onOfferWithdrawn(payload.data)
  })
  .on('broadcast', { event: 'status_changed' }, (payload) => {
    onStatusChange(payload.data.status)
  })
  .on('broadcast', { event: 'driver_location' }, (payload) => {
    onDriverLocation(payload.data)
  })
  .subscribe()
```

**Server-side broadcast (Edge Functions):**
```typescript
// In select-offer/index.ts, after accepting offer
await supabase.channel(`ride:${ride_session_id}`).send({
  type: 'broadcast',
  event: 'status_changed',
  payload: { status: 'hold', driver_id: offer.driver_user_id }
})
```

---

## 4. Client Service Gaps

### 4.1 Missing Realtime Services

**Need to add:**
- `src/services/realtime.service.ts` - Broadcast channel management
- `src/hooks/useRideRealtime.ts` - React hook for ride updates
- `src/hooks/useDriverRealtime.ts` - React hook for driver updates

---

### 4.2 Missing API Methods

**Current `rides.service.ts` is missing:**
- `selectOffer()` - Call select-offer Edge Function
- `cancelRide()` - Call cancel-ride Edge Function
- `markDriverArrived()` - NEW: Call mark-driver-arrived Edge Function

---

## 5. Priority Implementation Order

### Phase 1: Critical State Machine Fixes (High Priority)

| Task | Effort | Files |
|------|--------|-------|
| Add `arrived` state to enum | Low | New migration |
| Create `mark-driver-arrived` Edge Function | Medium | New function |
| Update `claim-qr-token` to require `arrived` state | Low | Existing function |
| Update `activate-ride` to transition from `arrived` | Low | Existing function |

### Phase 2: PostGIS & Geofencing (High Priority)

| Task | Effort | Files |
|------|--------|-------|
| Enable PostGIS extension | Low | New migration |
| Add geography columns | Medium | New migration |
| Create `check_within_geofence` function | Low | New migration |
| Add geofence validation to `claim-qr-token` | Medium | Existing function |

### Phase 3: Realtime Broadcast (Medium Priority)

| Task | Effort | Files |
|------|--------|-------|
| Create realtime service | Medium | New service |
| Update Edge Functions to broadcast | Medium | Multiple functions |
| Update client subscriptions | Medium | Multiple services |

### Phase 4: Timeouts & Background Jobs (Medium Priority)

| Task | Effort | Files |
|------|--------|-------|
| Add offer expiration column | Low | New migration |
| Create offer expiration job | Medium | New function or cron |
| Create hold timeout job | Medium | New function or cron |
| Create discovery wave expansion job | Medium | New function or cron |

### Phase 5: Cleanup & Optimization (Lower Priority)

| Task | Effort | Files |
|------|--------|-------|
| Add BRIN index to ride_events | Low | New migration |
| Add append-only triggers | Low | New migration |
| Guest token rate limiting | Medium | Multiple files |

---

## 6. Migration Strategy

### Approach: Non-Breaking Changes First

1. **Add new columns/types alongside existing** (don't drop old columns)
2. **Deploy Edge Function updates** that support both old and new schemas
3. **Update client code** to use new features
4. **Remove deprecated columns** in a later migration

### Database Migration Order

```
20260130000001_add_arrived_state.sql
20260130000002_enable_postgis.sql
20260130000003_add_geography_columns.sql
20260130000004_add_offer_expires_at.sql
20260130000005_add_ride_events_brin_index.sql
20260130000006_add_geofence_function.sql
```

---

## 7. Testing Requirements

### Unit Tests Required

- [ ] State machine transitions (all 10 states)
- [ ] QR token validation (all 10 steps)
- [ ] Geofence calculation (boundary cases)
- [ ] Offer expiration logic
- [ ] Hold timeout logic

### Integration Tests Required

- [ ] Full ride flow: created → completed
- [ ] Full ride flow with cancellation at each state
- [ ] QR scan with driver at various distances
- [ ] Concurrent offer acceptance (race condition)
- [ ] Guest mode full flow

---

## 8. Questions for Clarification

Before proceeding, please confirm:

1. **Arrived State Trigger:** Should `arrived` be triggered by:
   - Driver manually clicking "I've arrived"?
   - Automatic geofence detection when driver enters 100m radius?
   - Both options?

2. **PostGIS Priority:** Given PostGIS requires schema changes:
   - Proceed with PostGIS now?
   - Or implement geofence as simple haversine calculation first?

3. **Background Jobs:** Supabase options for scheduled tasks:
   - pg_cron extension
   - External scheduler (e.g., Render cron, GitHub Actions)
   - Edge Function with self-scheduling
   - Which approach is preferred?

4. **Realtime Migration:** 
   - Migrate to Broadcast immediately?
   - Or keep Postgres Changes for now and migrate later?

---

## Appendix: Current vs Spec State Machine

### Current Implementation (8 states)

```
created → discovery → hold → confirmed → active → completed
           ↓           ↓                          ↓
        expired    discovery(timeout)          canceled
                   canceled
```

### Spec Implementation (10 states)

```
created → discovery → hold → confirmed → arrived → active → completed
   ↓         ↓          ↓        ↓          ↓        ↓
canceled  expired   discovery  canceled  canceled canceled
                   (timeout)
```

### State Transition Matrix (Spec)

| From | To | Trigger | Actor |
|------|-----|---------|-------|
| created | discovery | Start discovery | Rider/System |
| created | canceled | Cancel | Rider |
| discovery | hold | Accept offer | Rider |
| discovery | expired | 90s timeout | System |
| discovery | canceled | Cancel | Rider |
| hold | confirmed | Driver confirms | Driver |
| hold | discovery | 60s timeout | System |
| hold | canceled | Cancel | Rider |
| confirmed | arrived | Driver arrives | Driver |
| confirmed | canceled | Cancel | Rider/Driver |
| arrived | active | QR scan validated | System |
| arrived | canceled | Cancel | Rider/Driver |
| active | completed | Driver completes | Driver |
| active | canceled | Cancel | Rider/Driver |

---

*Document generated by Claude for RORA implementation review.*
