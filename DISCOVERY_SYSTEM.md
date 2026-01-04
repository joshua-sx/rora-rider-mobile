# Discovery System Complete ✅

**Date:** 2026-01-04
**Branch:** `claude/discovery-system-zhduX`
**Status:** Core discovery system implemented (Phase D)

---

## Summary

Implemented the discovery system that broadcasts ride requests to drivers in prioritized waves, displays animated discovery UI, and collects driver offers in real-time.

---

## Components Implemented

### 1. start-discovery Edge Function ✅

**File:** `supabase/functions/start-discovery/index.ts`

**Features:**
- Updates ride session status: `created` → `discovery`
- Implements Wave 0 (favorited drivers) and Wave 1 (nearby drivers)
- Service area tag matching for prioritization
- Push notification + inbox notification for drivers
- Haversine distance calculation for proximity filtering
- Logs discovery_started event to ride_events

**Wave Logic:**

**Wave 0: Favorited Drivers**
- Query `favorites` table for rider's favorited drivers
- Filter by `is_active` and `accepting_requests`
- Notify immediately (highest priority)

**Wave 1: Nearby Drivers**
- Query drivers within Wave 1 radius (default 5km from region config)
- Prioritize drivers with matching service area tags
  - Example: Airport pickup → notify drivers with 'airport' tag first
- Filter by bounding box, then precise haversine distance
- Exclude already-notified drivers (Wave 0)

**Wave 2+ (Future):**
- Expanded radius after 10 minutes with no offers
- Implemented via separate expansion job (not yet created)
- Rider prompted: "We couldn't find a nearby driver yet. Want us to look farther out?"

**Input:**
```typescript
{
  ride_session_id: string
}
```

**Output:**
```typescript
{
  success: true,
  ride_session_id: string,
  notified_driver_count: number,
  wave_0_count: number,
  wave_1_count: number
}
```

**Database Updates:**
- `ride_sessions.status` → `'discovery'`
- `ride_sessions.discovery_started_at` → `now()`
- `ride_sessions.current_wave` → `0`
- Inserts into `ride_events` table
- Inserts into `notifications` table (inbox)
- Sends push notifications via Expo Push API

---

### 2. DiscoveryScreen ✅

**File:** `src/features/ride/screens/DiscoveryScreen.tsx`

**Features:**
- Calls start-discovery Edge Function on mount
- Rotating animated status messages (3-second interval)
- Fade-in/fade-out animations using React Native Animated
- Supabase Realtime subscription for new offers
- Auto-navigation to OffersListScreen when first offer received
- 10-minute timeout with "Expand search" prompt
- Cancel ride button with confirmation dialog
- Analytics tracking (discovery_started, offer_received, discovery_expanded, ride_canceled)

**Animated Status Messages:**
```typescript
const DISCOVERY_MESSAGES = [
  'Finding drivers near you...',
  'Checking driver availability...',
  'Looking for the best match...',
  'Reaching out to nearby drivers...',
  'Waiting for responses...',
];
```

**User Flow:**
1. Screen opens, immediately calls start-discovery Edge Function
2. Loading indicator: "Starting discovery..."
3. Animated status messages rotate every 3 seconds
4. Subscribes to ride_offers table via Realtime
5. When first offer received → navigate to OffersListScreen
6. If no offers after 10 minutes → show "Expand search" prompt
7. User can cancel at any time → marks session as canceled

**Realtime Subscription:**
```typescript
const channel = supabase
  .channel(`ride_offers:${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'ride_offers',
    filter: `ride_session_id=eq.${sessionId}`,
  }, handleOfferReceived)
  .subscribe();
```

---

### 3. OffersListScreen (Placeholder) ✅

**File:** `src/features/ride/screens/OffersListScreen.tsx`

**Features:**
- Displays top 3 offers prominently
- "+ X more offers" expandable section
- Price context labels (Google Flights-style)
  - **Good deal** (green): Offer ≤ Rora Fare − 20%
  - **Normal** (no label): Offer within −20% to +30%
  - **Pricier than usual** (orange): Offer ≥ Rora Fare + 30%
- Driver info: name, badges (Rora Pro, Verified)
- Real-time offer updates via Supabase Realtime
- "Select" button per offer (navigates to Phase E)
- Sorted by price (ascending)

**Price Label Logic:**
```typescript
const getPriceLabel = (offerAmount: number, roraFare: number) => {
  const percentDiff = ((offerAmount - roraFare) / roraFare) * 100;

  if (percentDiff <= -20) {
    return { label: 'Good deal', color: '#34C759' };
  } else if (percentDiff >= 30) {
    return { label: 'Pricier than usual', color: '#FF9500' };
  }
  return null; // Normal price, no label
};
```

**Note:** Full implementation deferred to Phase E (Offers & Selection). Current version shows offers but select-offer Edge Function not yet implemented.

---

### 4. QRSessionScreen Update ✅

**File:** `src/features/ride/screens/QRSessionScreen.tsx` (updated)

**Changes:**
- Updated `handleStartDiscovery()` to pass required params to DiscoveryScreen
- Params: `rideSessionId`, `originLabel`, `destinationLabel`, `fareAmount`

---

## User Journey

### Complete Flow (Discovery Phase)

```
1. QRSessionScreen: User taps "Look for Drivers"
   ↓
2. Navigate to DiscoveryScreen
   ↓
3. DiscoveryScreen calls start-discovery Edge Function
   ↓
4. Backend updates session status: created → discovery
   ↓
5. Backend notifies drivers:
   - Wave 0: Favorited drivers
   - Wave 1: Nearby drivers (prioritized by service area tags)
   ↓
6. DiscoveryScreen shows animated status messages
   ↓
7. Rider waits (no visible countdown)
   ↓
8. Driver submits offer (Accept or Counter)
   ↓
9. Realtime subscription fires → DiscoveryScreen detects offer
   ↓
10. Navigate to OffersListScreen
    ↓
11. Display all offers sorted by price, top 3 prominent
    ↓
12. Rider selects offer (Phase E implementation pending)
```

---

## Database Schema Updates

No new tables required. Uses existing schema:

**ride_sessions:**
- `status` updated: `'created'` → `'discovery'`
- `discovery_started_at` set to now()
- `current_wave` set to 0

**ride_events:**
- New event logged: `'discovery_started'`

**ride_offers:**
- Subscribed via Realtime for INSERT events

**notifications:**
- In-app inbox notifications created for drivers

**favorites:**
- Queried for Wave 0 prioritization

**driver_profiles:**
- Queried for nearby drivers
- Filtered by `is_active`, `accepting_requests`, `region_id`
- Service area tags used for prioritization

**regions:**
- `discovery_radius_config` JSONB field contains wave radii:
  ```json
  {
    "wave_1_radius_km": 5,
    "wave_2_radius_km": 10,
    "wave_3_radius_km": 20
  }
  ```

---

## Analytics Events Tracked

| Event | Triggered When | Properties |
|-------|----------------|------------|
| `discovery_started` | start-discovery Edge Function called | ride_session_id, notified_drivers |
| `offer_received` | First offer received via Realtime | ride_session_id, offer_type, offer_amount |
| `discovery_expanded` | Rider taps "Expand search" | ride_session_id |
| `ride_canceled` | Rider cancels during discovery | ride_session_id, stage: 'discovery' |

---

## Error Handling

**Scenarios Covered:**
- Invalid ride session ID → Alert, navigate back
- start-discovery API failure → Alert, navigate back
- Realtime subscription failure → Graceful degradation (manual refresh on offers screen)
- Session not in 'created' state → 400 error response
- No drivers available → Expand search prompt after 10 minutes

**User-Friendly Messages:**
- "Failed to start looking for drivers. Please try again."
- "Invalid ride session"
- "We couldn't find a nearby driver yet. Want us to look farther out?"

---

## Design Highlights

**Consistent Styling:**
- Primary color: #007AFF (iOS blue)
- Success green: #34C759
- Warning orange: #FF9500
- Background: #fff (white)
- Secondary background: #F5F5F5, #F9F9F9
- Text: #333 (dark), #666 (medium), #999 (light)
- Border radius: 8-12px
- Shadow: subtle elevation for depth

**Animations:**
- Fade in/out for status messages (300ms duration)
- ActivityIndicator for loading states
- Smooth transitions between screens

**Touch Targets:**
- Minimum 44x44pt for accessibility
- Clear visual feedback on press
- Disabled states when loading

---

## Performance

**Optimizations:**
- Realtime subscriptions cleaned up on unmount
- Message rotation uses single interval, not multiple
- Haversine distance calculation server-side (not client)
- Push notifications sent in batches
- Offers sorted once, not on every render

**Realtime Efficiency:**
- Single channel per ride session
- Filtered subscription: `ride_session_id=eq.${sessionId}`
- Auto-unsubscribes on unmount

---

## Push Notifications

**Driver Notification Payload:**
```typescript
{
  to: driver.expo_push_token,
  title: 'New Ride Request',
  body: `${origin_label} → ${destination_label}`,
  data: {
    type: 'new_ride_request',
    ride_session_id: rideSessionId,
  },
  sound: 'default',
  priority: 'high',
}
```

**Sent via Expo Push API:**
- Endpoint: `https://exp.host/--/api/v2/push/send`
- Non-blocking: Errors don't fail discovery
- Bundling not yet implemented (future enhancement)

**In-App Inbox Fallback:**
- All drivers get inbox notification regardless of push token
- Stored in `notifications` table
- Deep link data included for navigation

---

## Still TODO

### Phase D Enhancements (Discovery)
- Implement expand-discovery-wave Edge Function (Wave 2+)
- pg_cron job for automatic wave expansion after 10 minutes
- Discovery exhaustion flow after ~45-60 minutes
- Notification bundling (multiple rapid offers)
- Reminder push after 10/20 minutes with pending offers

### Phase E: Offers & Selection (Next)
- submit-offer Edge Function (driver side)
- select-offer Edge Function (rider side)
- Hold phase (5-minute timeout)
- Fallback to second-choice offer
- HoldConfirmationScreen
- In-person scan override prompt

### Phase F: Ride Lifecycle
- confirm-ride Edge Function
- start-ride Edge Function (driver side)
- complete-ride Edge Function (driver side)
- ActiveRideScreen
- CompletionSummaryScreen
- Rating prompt
- cancel-ride Edge Function

---

## Files Created/Modified

```
Created:
  supabase/functions/start-discovery/index.ts
  src/features/ride/screens/DiscoveryScreen.tsx
  src/features/ride/screens/OffersListScreen.tsx
  DISCOVERY_SYSTEM.md

Modified:
  src/features/ride/screens/QRSessionScreen.tsx
```

---

## Dependencies Used

**Existing:**
- `@supabase/supabase-js` - Realtime subscriptions, Edge Functions
- `expo-router` - Navigation
- `react-native` - Animated API for status messages
- `posthog-react-native` - Analytics tracking

**No new dependencies added** ✅

---

## Testing Checklist

Before deploying:

- [ ] Test start-discovery Edge Function with valid session
- [ ] Test start-discovery with invalid session (error handling)
- [ ] Test Wave 0 (favorited drivers) notification
- [ ] Test Wave 1 (nearby drivers) notification
- [ ] Test service area tag prioritization
- [ ] Test DiscoveryScreen animation (message rotation)
- [ ] Test Realtime subscription (insert offer, verify navigation)
- [ ] Test "Expand search" prompt after 10 minutes
- [ ] Test cancel during discovery (session marked as canceled)
- [ ] Test OffersListScreen display with multiple offers
- [ ] Test price labels (good_deal, normal, pricier)
- [ ] Test expandable "more offers" section
- [ ] Test analytics events fire correctly
- [ ] Test with both authenticated and guest users
- [ ] Test push notification delivery to drivers

---

## Integration Points

**APIs Called:**
- `supabase.functions.invoke('start-discovery')` - Initiates discovery
- `supabase.from('ride_sessions').update()` - Status transitions
- `supabase.from('ride_events').insert()` - Audit logging
- `supabase.from('ride_offers').select()` - Load offers
- `supabase.channel().on('postgres_changes')` - Realtime subscriptions

**External APIs:**
- `https://exp.host/--/api/v2/push/send` - Expo Push Notifications

**State Management:**
- `useAuth()` hook - User authentication state
- `useGuestToken()` hook - Guest token management
- Route params via `useLocalSearchParams()` - Navigation data
- Component state for UI (messages, offers, prompts)

**Analytics:**
- PostHog tracked events for funnel analysis (discovery_started, offer_received)

---

## Next Steps

1. **Implement Wave 2+ expansion** - expand-discovery-wave Edge Function + pg_cron job
2. **Build Phase E (Offers & Selection)** - submit-offer, select-offer, hold logic
3. **Add notification bundling** - Multiple rapid offers collapsed into one push
4. **Implement reminder pushes** - 10/20-minute reminders for pending offers
5. **Build Phase F (Ride Lifecycle)** - confirm, start, complete, cancel Edge Functions
6. **Add discovery exhaustion flow** - No drivers available after 45-60 minutes

---

## References

- SPEC §8 (Discovery & Ride Flow)
- SPEC §19 (Discovery UX)
- SPEC §25 (Screen Wireframes - Screen 4 Discovery, Screen 5 Offers)
- FR-20 to FR-23 (Discovery & Notifications)
- FR-24 to FR-26 (Offers & Price Labels)
- tasks/tasks-02-core-ride-loop.md Phase D

---

**Ready for:** Wave 2+ expansion and Phase E (Offers & Selection) implementation
