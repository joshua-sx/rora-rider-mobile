# Rora Ride E2E Test Checklist

**Date:** 2026-01-17
**Tester:** Manual validation before demo
**Focus:** 5 highest-risk areas from risk analysis

---

## Pre-Test Setup

### Environment Check
- [ ] Convex dev server running (`npx convex dev`)
- [ ] Expo dev server running (`npx expo start --ios`)
- [ ] iOS Simulator open and app loaded
- [ ] Guest mode enabled (logged out or fresh install)

### Reset to Clean State
```bash
# If needed, clear app data:
# iOS Simulator → Device → Erase All Content and Settings
# Or: Uninstall app and reinstall
```

---

## Test 1: Guest Mode & App Launch
**Risk Area:** Guest token system, auth initialization

### Steps:
1. Launch app (should NOT require login)
2. Check: App shows home screen with map
3. Check: No auth modal appears
4. Check: "Where to?" search pill visible

### Pass Criteria:
- ✅ App loads without crash
- ✅ No login required to access home screen
- ✅ Guest token created silently in background

### Notes/Bugs:
```
[Record any issues here]
```

---

## Test 2: Route Entry & Fare Calculation
**Risk Area:** Google Maps integration, pricing algorithm

### Steps:
1. Tap "Where to?" search pill
2. Enter pickup: "Princess Juliana International Airport"
3. Enter destination: "Maho Beach"
4. Check: Fare estimate appears
5. Check: Route polyline draws on map

### Expected Results:
- **Fare:** Should show zone-based fare (if airport→Maho is a fixed zone) OR distance-based calculation
- **Distance:** ~2-3 km
- **Price:** Approximately $15-20 (verify against `pricing.ts` logic)

### Pass Criteria:
- ✅ Autocomplete suggestions appear for both fields
- ✅ Fare calculated within 2 seconds
- ✅ Price seems reasonable (not $0, not $9999)
- ✅ Route polyline visible on map
- ✅ "Look for drivers" button enabled

### Notes/Bugs:
```
Fare shown: $_____
Distance: _____ km
Calculation time: _____ sec
Issues:
```

---

## Test 3: QR Generation & Display
**Risk Area:** QR security system, JWT token generation

### Steps:
1. From route summary, tap "Look for drivers"
2. Check: Screen transitions to DISCOVERING state
3. Check: QR code appears
4. Check: Countdown timer visible (should show ~10:00)
5. Check: Instruction text: "Show this QR code to your driver"
6. Screenshot the QR code for manual inspection

### Pass Criteria:
- ✅ QR code renders (not blank/broken)
- ✅ Timer counts down (10 min → 9:59 → ...)
- ✅ Session created in Convex (check Convex dashboard)
- ✅ QR token has correct payload (pickup, dropoff, roraFare)

### Debug:
```bash
# In Convex dashboard, check:
# - ride_sessions table has new entry with status="discovery"
# - qrTokens table has matching token with 10-min expiry
```

### Notes/Bugs:
```
QR renders: YES / NO
Timer working: YES / NO
Session ID: _________________
Issues:
```

---

## Test 4: Discovery Flow & Real-Time Offers
**Risk Area:** Offer expiry, real-time subscriptions, Google Maps proxy

### Steps:
1. While on discovery screen (QR visible), simulate driver offers:
   - **Option A:** Use driver app simulator (if available)
   - **Option B:** Manually insert offer via Convex dashboard
   - **Option C:** Use demo driver offer simulator (per commit 366e507)

2. Add 2-3 test offers with varied prices:
   - Offer 1: $18 (close to Rora Fare)
   - Offer 2: $12 (good deal, <15% below)
   - Offer 3: $30 (much higher, >50% above)

3. Check: Offers appear in real-time (no refresh needed)
4. Check: Offers ranked by proximity to Rora Fare
5. Check: Price labels correct ("Good deal", "Pricier than usual", etc.)

### Pass Criteria:
- ✅ Offers appear within 1-2 seconds of creation
- ✅ Offer cards show driver photo, name, vehicle, price
- ✅ Price context labels correct
- ✅ Offers sorted by proximity to Rora Fare (±10% prioritized)
- ✅ "Good deal" label is GREEN
- ✅ "Much higher" label is RED/WARNING color

### Notes/Bugs:
```
Offers received: _____ count
Real-time latency: _____ sec
Sorting correct: YES / NO
Price labels:
  - $12: ____________
  - $18: ____________
  - $30: ____________
Issues:
```

---

## Test 5: Offer Selection & Hold State
**Risk Area:** Ride state machine transitions, offer expiry logic

### Steps:
1. From offers list, tap the $18 offer (closest to Rora Fare)
2. Check: UI transitions to CONFIRMING state
3. Check: Server state transitions to "hold"
4. Check: Hold timer starts (5:00 countdown)
5. Check: Other offers auto-rejected or hidden
6. Wait 30 seconds
7. Check: Timer updates correctly

### Expected Server Behavior (verify in Convex dashboard):
- `ride_sessions.status` changes: `discovery` → `hold`
- `ride_sessions.selectedDriverId` set
- `offers.status` for selected offer: `pending` → `accepted`
- Other offers: `pending` → `declined`

### Pass Criteria:
- ✅ UI shows "Waiting for [Driver Name] to confirm"
- ✅ 5-minute countdown timer visible
- ✅ Server state = "hold"
- ✅ Only 1 offer active (others rejected)
- ✅ No UI crashes during transition

### Notes/Bugs:
```
State transition time: _____ sec
Hold timer working: YES / NO
Server state correct: YES / NO
Issues:
```

---

## Test 6: Hold Timeout (Optional - takes 5 min)
**Risk Area:** Timer expiry handling, driver demotion

### Steps:
1. From hold state, wait full 5 minutes (or manually expire in Convex)
2. Check: Timeout triggers return to discovery screen
3. Check: Failed driver demoted to bottom of offer list
4. Check: User can select 2nd choice driver

### Pass Criteria:
- ✅ Timeout detected
- ✅ UI returns to offer list
- ✅ Original driver still visible but ranked lower
- ✅ Can select another driver

### Notes/Bugs:
```
[Skip this test if time-constrained - low priority for demo]
```

---

## Test 7: Rate Limiting (Guest QR Limit)
**Risk Area:** Guest token rate limiting (5 QR/hour soft limit)

### Steps:
1. Cancel current ride
2. Create 4 more ride sessions (total 5 QR codes in 1 hour)
3. On 6th attempt, check for rate limit prompt
4. Check: Prompt says "Sign up for unlimited" (SOFT limit, not hard block)

### Pass Criteria:
- ✅ First 5 QR codes generate without issue
- ✅ 6th attempt shows signup prompt
- ✅ User CAN still generate QR (soft limit, not blocked)

### Notes/Bugs:
```
Rate limit triggered: YES / NO
Prompt shown: YES / NO
Can still proceed: YES / NO
Issues:
```

---

## Test 8: Offline → Online Recovery
**Risk Area:** Google Maps proxy failure, network retry logic

### Steps:
1. Enable Airplane Mode on simulator
2. Try to enter a new route
3. Check: Error message appears
4. Disable Airplane Mode
5. Tap retry button
6. Check: Route loads successfully

### Pass Criteria:
- ✅ Offline error message is friendly (not crash)
- ✅ Retry button appears
- ✅ Recovery works when network restored
- ✅ No cached stale data shown

### Notes/Bugs:
```
Error message shown: "______________________"
Retry worked: YES / NO
Issues:
```

---

## Test 9: QR Auto-Refresh (Long Test - 10 min)
**Risk Area:** QR token expiry and silent refresh

### Steps:
1. Generate a QR code
2. Let it sit for 10 minutes
3. Check: QR refreshes silently at ~10:00 mark
4. Check: No UI disruption (user doesn't notice)
5. Check: New token generated in Convex

### Pass Criteria:
- ✅ QR refreshes automatically
- ✅ No loading spinner or flash
- ✅ Timer resets to 10:00
- ✅ New token ID in database

### Notes/Bugs:
```
[OPTIONAL - Skip if time-constrained]
Auto-refresh worked: YES / NO
Issues:
```

---

## Critical Bugs Found

| # | Screen/Flow | Severity | Description | Blocker? |
|---|-------------|----------|-------------|----------|
| 1 |             |          |             | Y / N    |
| 2 |             |          |             | Y / N    |
| 3 |             |          |             | Y / N    |

---

## Demo Readiness Assessment

After completing tests 1-8, answer:

1. **Can you complete the happy path in <2 minutes?** YES / NO
2. **Is the guest mode working (no login required)?** YES / NO
3. **Do offers appear in real-time?** YES / NO
4. **Are there any BLOCKER bugs?** YES / NO

If all YES (except last), you're **demo-ready**. 🎉

If any blockers exist, prioritize fixes based on:
- Frequency (how often does it happen?)
- Severity (does it break the core flow?)
- Workaround (can you demo around it?)

---

## Next Steps

After testing:
1. [ ] Fix critical blockers
2. [ ] Add loading skeletons for slow states
3. [ ] Seed realistic demo driver data
4. [ ] Practice demo script 3x
5. [ ] Record backup video (60 sec screencast)
