# Core Ride Loop Backend Complete ✅

**Date:** 2026-01-04
**Branch:** `claude/core-ride-loop-zhduX`
**Status:** Backend services implemented

---

## Summary

Implemented the backend infrastructure for the core ride loop including pricing calculation, QR token generation, and ride session creation.

---

## What Was Completed

### 1. Google Maps Integration ✅ (Already Existed)

**Service:** `src/services/google-maps.service.ts`

**Features:**
- ✅ Places Autocomplete API
- ✅ Directions API (distance, duration, polyline)
- ✅ Distance Matrix API
- ✅ Place Details API
- ✅ Response caching (5-minute TTL)
- ✅ Retry logic with exponential backoff
- ✅ Error handling with custom error types
- ✅ Support for both proxy and direct API calls

**Capabilities:**
- Search for places with autocomplete
- Get turn-by-turn directions
- Calculate distances between multiple points
- Decode polylines for map visualization
- Sint Maarten-focused (restricted to country:sx)

---

### 2. Pricing Calculation Edge Function ✅

**Function:** `supabase/functions/calculate-fare/index.ts`

**Algorithm:**
1. Check if origin/destination is in a pricing zone (point-in-circle check)
2. If zones found, look for fixed fare (zone-to-zone)
3. If no fixed fare, use distance-based: base fare + (distance × per_km_rate)
4. Apply time-based modifiers (night, peak) if enabled
5. Return final amount with calculation metadata

**Pricing Methods:**
- **Zone Fixed:** Airport ↔ Maho Beach = $20 (pre-configured)
- **Distance Fallback:** $10 base + $2.50/km
- **Haversine Estimation:** Straight-line distance × 1.3 multiplier

**Modifiers:**
- Night rate (10pm-6am): 1.2x multiplier
- Weekend peak (Fri-Sat 6pm-10pm): 1.15x multiplier
- Configurable per region, disabled by default

**Input:**
```json
{
  "origin": { "lat": 18.0410, "lng": -63.1089 },
  "destination": { "lat": 18.0384, "lng": -63.1156 },
  "region_id": "uuid" // optional, defaults to Sint Maarten
}
```

**Output:**
```json
{
  "amount": 20.00,
  "pricing_rule_version_id": "uuid",
  "calculation_metadata": {
    "method": "zone_fixed" | "distance_fallback",
    "origin_zone_name": "Airport",
    "destination_zone_name": "Maho Beach",
    "distance_km": 5.2,
    "base_fare": 10,
    "per_km_rate": 2.5,
    "modifiers": [],
    "total": 20.00,
    "calculated_at": "2026-01-04T..."
  }
}
```

**Features:**
- ✅ Zone-based pricing (fixed fares)
- ✅ Distance-based fallback
- ✅ Haversine offline estimation
- ✅ Time-based modifiers (night, peak)
- ✅ Versioned pricing rules
- ✅ Full calculation metadata for audit trail
- ✅ Point-in-circle zone detection

---

### 3. QR Token Service ✅

**Service:** `src/services/qr-token.service.ts`

**QR Token Payload:**
```typescript
{
  jti: string;                 // Unique token ID
  ride_session_id: string;      // Ride session reference
  origin_label: string;         // Display on driver app
  destination_label: string;    // Display on driver app
  rora_fare_amount: number;     // Display amount
  iat: number;                  // Issued at (Unix timestamp)
  exp: number;                  // Expires in 10 minutes
}
```

**Functions:**
- `generateQRTokenPayload()` - Create token payload with 10-min expiry
- `encodeQRToken()` - Base64-encode payload (MVP)
- `decodeQRToken()` - Decode and parse token
- `isQRTokenExpired()` - Check token expiry
- `generateQRTokenForRide()` - One-step token generation

**Security Note:**
- MVP uses base64 encoding (not cryptographically signed)
- Production should use proper JWT with HS256/RS256 signing
- Token validation happens server-side via `qr_token_jti` unique constraint

---

### 4. Ride Session Creation Edge Function ✅

**Function:** `supabase/functions/create-ride-session/index.ts`

**Workflow:**
1. Validate origin/destination coordinates
2. Authenticate user (Auth header) or validate guest token (X-Guest-Token header)
3. Generate unique QR token JTI
4. Insert ride session into database
5. Log creation event to `ride_events` table
6. Return ride session + QR token JTI

**Input:**
```json
{
  "origin": {
    "lat": 18.0410,
    "lng": -63.1089,
    "label": "Princess Juliana Airport"
  },
  "destination": {
    "lat": 18.0384,
    "lng": -63.1156,
    "label": "Maho Beach",
    "freeform_name": "Sunset Bar" // optional
  },
  "rora_fare_amount": 20.00,
  "pricing_rule_version_id": "uuid",
  "pricing_calculation_metadata": { /* from calculate-fare */ },
  "request_type": "broadcast" | "direct",
  "target_driver_id": "uuid", // if direct request
  "region_id": "uuid" // optional
}
```

**Headers:**
- `Authorization: Bearer <supabase_jwt>` (authenticated user)
- `X-Guest-Token: <guest_token>` (guest user)

**Output:**
```json
{
  "success": true,
  "ride_session": {
    "id": "uuid",
    "status": "created",
    "qr_token_jti": "uuid",
    /* ...full ride session */
  },
  "qr_token_jti": "uuid"
}
```

**Features:**
- ✅ Supports both authenticated and guest users
- ✅ Validates origin/destination
- ✅ Generates unique QR token JTI
- ✅ Logs ride creation event
- ✅ Handles broadcast and direct requests
- ✅ Defaults to Sint Maarten region

---

## Data Flow

### Complete Ride Creation Flow

```
1. User selects origin + destination in app
   ↓
2. App calls calculate-fare Edge Function
   ↓
3. Receive Rora Fare estimate
   ↓
4. User taps "Generate QR"
   ↓
5. App calls create-ride-session Edge Function
   ↓
6. Ride session created with status: 'created'
   ↓
7. App generates QR token with ride_session_id + qr_token_jti
   ↓
8. QR code displayed to user (cached for offline)
   ↓
9. User taps "Look for drivers" → Start discovery (next phase)
```

---

## State Machine

**Ride Status Flow:**
```
created → discovery → hold → confirmed → active → completed
              ↓         ↓        ↓
           expired   expired  canceled
```

**Status Definitions:**
- `created`: Ride session exists, QR generated
- `discovery`: Broadcasting to nearby drivers
- `hold`: Driver selected, waiting for confirmation
- `confirmed`: Driver confirmed, ride about to start
- `active`: Ride in progress
- `completed`: Ride finished successfully
- `canceled`: Rider or driver canceled
- `expired`: No response/timeout

---

## Security

**Server-Side Enforcement:**
- ✅ All pricing calculations server-side (calculate-fare)
- ✅ All ride creation server-side (create-ride-session)
- ✅ Ride state transitions logged to `ride_events` (append-only)
- ✅ QR token JTI stored in database (unique constraint)
- ✅ Guest token validation required
- ✅ RLS policies enforce rider ownership

**Client Cannot:**
- ❌ Manipulate pricing calculations
- ❌ Create rides without auth/guest token
- ❌ Modify ride status directly
- ❌ Forge QR tokens (JTI validation server-side)

---

## Still TODO (From tasks-02-core-ride-loop.md)

### UI Screens Needed:
- **HomeMapScreen**: Map with location, "Where to?" input, zone chips
- **RouteEstimateScreen**: Origin/destination inputs, fare display, "Generate QR" button
- **QRSessionScreen**: QR code display, "Look for drivers" button
- **DiscoveryScreen**: Animated "Finding drivers..." progress
- **OffersListScreen**: Driver offers with price context labels
- **RideDetailScreen**: Active ride tracking

### Additional Backend:
- **start-discovery Edge Function**: Broadcast to drivers (discovery waves)
- **handle-offer Edge Function**: Process driver offers
- **update-ride-status Edge Function**: State transitions with validation

### Features:
- Discovery waves (Wave 0: favorites, Wave 1: service area, etc.)
- Push notifications for offers
- Offer comparison (price labels: good_deal, normal, pricier)
- Hold phase timeout (5 minutes)
- QR scanning by drivers

---

## Files Created

```
src/services/
  qr-token.service.ts              # QR token generation/validation

supabase/functions/
  calculate-fare/
    index.ts                       # Pricing calculation Edge Function
  create-ride-session/
    index.ts                       # Ride session creation Edge Function
```

**Files Already Existed:**
```
src/services/
  google-maps.service.ts           # Google Maps API wrapper (complete)
```

---

## Testing Checklist

Before deploying:

- [ ] Test calculate-fare with zone coordinates (Airport ↔ Maho)
- [ ] Test calculate-fare with non-zone coordinates (distance fallback)
- [ ] Test calculate-fare with night modifier (after 10pm)
- [ ] Test calculate-fare with peak modifier (Fri-Sat 6pm-10pm)
- [ ] Test create-ride-session with authenticated user
- [ ] Test create-ride-session with guest token
- [ ] Test create-ride-session without auth (should fail)
- [ ] Verify ride_events logging works
- [ ] Verify qr_token_jti uniqueness constraint
- [ ] Test QR token encoding/decoding
- [ ] Test QR token expiry (10 minutes)

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/calculate-fare` | POST | Calculate Rora Fare for route |
| `/functions/v1/create-ride-session` | POST | Create new ride session |
| `/functions/v1/validate-guest-token` | POST | Validate guest token |
| `/functions/v1/migrate-guest-rides` | POST | Migrate guest rides on signup |

---

## Environment Variables

**Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

**Optional:**
- `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN`

---

## Next Steps

1. **Build UI Screens** (HomeMapScreen, RouteEstimateScreen, QRSessionScreen)
2. **Implement Discovery System** (start-discovery Edge Function, push notifications)
3. **Implement Offer Management** (handle-offer Edge Function, offer comparison UI)
4. **Add Real-Time Updates** (Supabase Realtime for live offers)
5. **Implement Hold Phase** (5-minute timeout, fallback selection)
6. **Add Driver QR Scanning** (validate qr_token_jti)

---

## References

- SPEC §8 (Discovery & Ride Flow)
- SPEC §10 (QR Token System)
- SPEC §11 (Pricing System)
- SPEC §17 (Maps & Location)
- FR-7 to FR-39
- tasks/tasks-02-core-ride-loop.md
- CONTRIBUTING.md (commit conventions)

---

**Ready for:** UI screen implementation + discovery system
