# Complete Testing Guide - Google Maps Integration

## 🎯 Overview

This guide shows you how to test your Google Maps integration using **two methods**:
1. **Command-line test script** - Fast verification of all APIs
2. **In-app test screen** - Interactive testing on device/simulator

---

## ✅ What I've Done For You

I've tested your Google Maps configuration and created comprehensive testing tools:

### 1. **Test Script Created** ✅
- Location: [scripts/test-google-maps.js](scripts/test-google-maps.js)
- Tests all 6 Google Maps APIs
- Shows detailed results with error messages
- Can run from command line in seconds

### 2. **In-App Test Screen Created** ✅
- Location: `components/dev/api-test-screen.tsx`
- Beautiful UI with test results
- Run tests directly on your phone/simulator
- Shows pass/fail status for each API
- Note: This screen is no longer a route. It’s kept as a component for reference/dev use.

### 3. **Configuration Verified** ✅
- Proxy + env vars configured (no client web-service keys required)
- Environment variables set up securely
- All files use correct imports
- Sint Maarten location bias configured
- Country restriction to Sint Maarten (SX)

### 4. **Test Results Documented** ✅
- See [TEST_RESULTS.md](TEST_RESULTS.md) for current status
- All APIs tested - found 2 issues to fix
- Clear instructions on how to resolve

---

## 🧪 Method 1: Command-Line Testing (Fastest)

### Run the Test

```bash
# Server-side test (direct to Google). This is NOT how the app calls Google in production.
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"
npm run test:maps
```

Or run directly:
```bash
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE node scripts/test-google-maps.js
```

### What It Tests

1. **API Key Validation** - Verifies key is valid
2. **Places Autocomplete** - Searches for "Princess Juliana Airport"
3. **Place Details** - Gets coordinates for the airport
4. **Geocoding** - Converts "Maho Beach" to coordinates
5. **Reverse Geocoding** - Converts coordinates to address
6. **Directions** - Calculates route from Airport to Maho Beach

**Note:** The production app uses the Cloud Run proxy for Places/Directions/Distance Matrix.

### Expected Output (After Fixing)

```
╔════════════════════════════════════════════════════════════╗
║      Google Maps API Integration Test Suite               ║
╚════════════════════════════════════════════════════════════╝

🔑 API Key: AIzaSyDnx60vHeQUMwgc...
📍 Test Location: Sint Maarten (18.0425, -63.0548)
📏 Search Radius: 20km

🧪 Testing: API Key Validation... ✅ PASSED
   ℹ️  API Key Status: Valid and Working

🧪 Testing: Places Autocomplete API... ✅ PASSED
   ℹ️  Found 5 suggestions:
      1. Princess Juliana International Airport, Airport Road, Simpson Bay, Sint Maarten
      2. Princess Juliana Airport Taxi Stand, Simpson Bay, Sint Maarten
      3. Princess Hotel & Casino, Sint Maarten

🧪 Testing: Place Details API... ✅ PASSED
   ℹ️  Place Details:
      Name: Princess Juliana International Airport
      Address: Airport Road, Simpson Bay, Sint Maarten
      Coordinates: 18.0419, -63.1086

🧪 Testing: Geocoding API... ✅ PASSED
   ℹ️  Geocoded "Maho Beach, Sint Maarten":
      Coordinates: 18.0485, -63.1204
      Formatted: Maho Beach, Simpson Bay, Sint Maarten

🧪 Testing: Reverse Geocoding API... ✅ PASSED
   ℹ️  Reverse Geocoded (18.0425, -63.0548):
      Address: Sint Maarten

🧪 Testing: Directions API... ✅ PASSED
   ℹ️  Route Details:
      Distance: 1.5 km
      Duration: 3 mins
      Polyline points: 245 chars

╔════════════════════════════════════════════════════════════╗
║                    Test Summary                            ║
╚════════════════════════════════════════════════════════════╝

✅ Passed: 6
❌ Failed: 0
📊 Total:  6

🎉 All tests passed! Google Maps integration is working correctly.
```

---

## 📱 Method 2: In-App Testing (Visual)

### Prereqs (Proxy)

Set these before launching the app:

```bash
export EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL="https://YOUR_CLOUD_RUN_SERVICE-xxxxx-uc.a.run.app"
export EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN="YOUR_LONG_RANDOM_TOKEN"
```

### How to Access

1. Start your app:
   ```bash
   npm start
   ```

2. Navigate to the test screen:
   - This screen has been removed as a routable page. Use the script-based testing flow below.

3. Tap the "Run Tests" button

### What You'll See

**Before running tests:**
- List of 6 tests with gray circles (pending)
- Blue "Run Tests" button at bottom

**While running:**
- Tests change to spinning loader (running)
- Tests complete one by one

**After completion:**
- Green checkmarks ✅ for passed tests
- Red X marks ❌ for failed tests
- Summary showing: X Passed, Y Failed
- Expandable details for each test

### Test Details Shown

Each test shows:
- **Status** - Passed/Failed with icon
- **Message** - Brief result summary
- **Details** - Expandable section with:
  - Suggestions found
  - Coordinates retrieved
  - Addresses resolved
  - Route information

---

## 🔍 Current Test Results

**Status:** Tests executed, issues identified

```
✅ Passed: 0
❌ Failed: 6
```

### Issues Found

1. **Billing Not Enabled** ⚠️
   - All tests fail with "You must enable Billing"
   - **Fix:** Enable billing in Google Cloud Console
   - Time: 5 minutes
   - Cost: Free ($200/month credit, you'll use ~$55)

2. **APIs Not Enabled** ⚠️
   - Some tests fail with "This API project is not authorized"
   - **Fix:** Enable 6 required APIs
   - Time: 5 minutes
   - Cost: Free (within quota)

### How to Fix

See complete instructions in [TEST_RESULTS.md](TEST_RESULTS.md)

**Quick Fix:**
1. Go to: https://console.cloud.google.com/billing
2. Link billing account (credit card required)
3. Go to: https://console.cloud.google.com/apis/library
4. Enable each API (6 total)
5. Wait 5 minutes
6. Run tests again

---

## 🎯 Testing the Complete App Flow

After APIs are enabled, test the real user journey:

### Step-by-Step Test

1. **Start App**
   ```bash
   npm start
   ```

2. **Navigate to Home** (`/`)
   - Should see map of Sint Maarten
   - Should see "Search destination" button

3. **Tap "Search destination"**
   - Should navigate to `/location-picker`
   - Should see two search inputs

4. **Test Pickup Location**
   - Tap "Current Location" input
   - Type: "Princess"
   - **Expected:** Suggestions appear within 1 second
   - **Expected:** See "Princess Juliana Airport"
   - Select the airport

5. **Test Dropoff Location**
   - Tap "Dropoff location" input
   - Type: "Maho"
   - **Expected:** See "Maho Beach"
   - Select Maho Beach

6. **Tap Continue**
   - Green button appears when both locations selected
   - **Expected:** Navigate to `/route-input`
   - **Expected:** See "Calculating route..." loading state

7. **Wait for Route Calculation** (2-3 seconds)
   - **Expected:** Auto-navigate to `/trip-preview`
   - **Expected:** See fullscreen map
   - **Expected:** Green marker at airport
   - **Expected:** Red marker at Maho Beach
   - **Expected:** Green line connecting them

8. **Check Bottom Sheet**
   - Pull up to expand
   - **Expected:** See distance (~1.5 km)
   - **Expected:** See duration (~3 mins)
   - **Expected:** See price ($5-10)
   - **Expected:** See "Confirm Ride" button

### Expected Locations to Work

All these should return results:
- "Princess Juliana Airport"
- "Maho Beach"
- "Philipsburg"
- "Simpson Bay"
- "Marigot"
- "Orient Bay"
- "Grand Case"
- "Mullet Bay"

---

## 📊 Performance Benchmarks

### Expected Response Times

| Operation | Target | Acceptable | Slow |
|-----------|--------|------------|------|
| Autocomplete suggestion | < 500ms | < 1s | > 2s |
| Place details fetch | < 300ms | < 500ms | > 1s |
| Route calculation | < 2s | < 3s | > 5s |
| Map render | < 1s | < 2s | > 3s |

### What Good Performance Looks Like

- Type "Prin" → Suggestions appear instantly
- Select place → Immediately shows in input
- Tap Continue → Route calculates in 2-3 seconds
- Map loads → Appears within 1 second
- All transitions feel smooth and responsive

### What Poor Performance Looks Like

- Long delays before suggestions appear (> 2s)
- "Loading..." state lasts too long (> 5s)
- Map takes forever to render (> 3s)
- App feels sluggish or frozen

**If you see poor performance:**
- Check internet connection
- Check API quotas (might be throttled)
- Check console for errors
- Verify APIs are enabled

---

## 🐛 Common Issues & Solutions

### Issue: No Suggestions Appearing

**Symptoms:**
- Type in search box
- No dropdown appears
- No suggestions shown

**Causes & Fixes:**
1. Places API not enabled → Enable in Console
2. Billing not enabled → Enable billing
3. No internet connection → Check WiFi
4. API key restrictions → Check restrictions allow this app

### Issue: "REQUEST_DENIED" Error

**Symptoms:**
- Error in console: "REQUEST_DENIED"
- No suggestions or map

**Causes & Fixes:**
1. API not enabled → Enable the specific API
2. Billing not enabled → Enable billing
3. API key invalid → Check key is correct
4. Restrictions too strict → Temporarily remove restrictions to test

### Issue: Route Calculation Fails

**Symptoms:**
- Stuck on "Calculating route..."
- Never navigates to trip preview
- Error in console

**Causes & Fixes:**
1. Directions API not enabled → Enable it
2. Invalid coordinates → Check place details are correct
3. Origin = Destination → Select different locations
4. Network error → Check internet connection

### Issue: Map Not Showing

**Symptoms:**
- Blank white screen
- Map area is empty
- Markers not visible

**Causes & Fixes:**
1. Maps SDK not enabled → Enable for iOS/Android
2. API key not in app.json → Update app.json
3. Need to rebuild app → Run `npx expo prebuild --clean`
4. Location permissions → Grant location access

---

## 📈 Monitoring in Production

### Set Up Monitoring

1. **API Dashboard**
   - https://console.cloud.google.com/apis/dashboard
   - Check daily for usage patterns
   - Look for sudden spikes

2. **Billing Alerts**
   - https://console.cloud.google.com/billing/alerts
   - Set alerts at: $50, $100, $150
   - Get email when thresholds hit

3. **Error Tracking**
   - Monitor console logs
   - Track failed API calls
   - Log error rates

### What to Monitor

- **Request counts** - Should match ride counts
- **Error rates** - Should be < 1%
- **Response times** - Should be < 2s average
- **Costs** - Should be ~$0.06 per ride

### Red Flags

⚠️ **Sudden cost spike** - Possible abuse or bot traffic
⚠️ **High error rate** - API issues or config problem
⚠️ **Slow responses** - Quota limits or throttling
⚠️ **Zero requests** - App broken or key issue

---

## ✅ Final Checklist

Before going to production:

**Setup:**
- [ ] Billing enabled in Google Cloud
- [ ] All 6 APIs enabled
- [ ] API key restrictions configured
- [ ] Billing alerts set up

**Testing:**
- [ ] Command-line tests pass (6/6)
- [ ] In-app tests pass (6/6)
- [ ] Can search for locations
- [ ] Autocomplete returns results
- [ ] Can calculate routes
- [ ] Map displays correctly
- [ ] Distance/duration/price shown

**Performance:**
- [ ] Suggestions appear quickly (< 1s)
- [ ] Route calculates fast (< 3s)
- [ ] Map loads smoothly (< 2s)
- [ ] No console errors
- [ ] Tested on iOS
- [ ] Tested on Android

**Security:**
- [ ] API keys not committed to git
- [ ] Using environment variables
- [ ] API restrictions in place
- [ ] Application restrictions configured
- [ ] Monitoring set up

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Test script shows: "All tests passed!"
2. ✅ In-app test screen: All green checkmarks
3. ✅ Can type "Maho" and see "Maho Beach" suggestion
4. ✅ Selecting locations shows green Continue button
5. ✅ Route calculation completes in < 3 seconds
6. ✅ Trip preview shows map with route line
7. ✅ No errors in console
8. ✅ All transitions feel smooth

**When all above are ✅, your app is production-ready!** 🚀

---

## 📞 Getting Help

If you're stuck:

1. **Check TEST_RESULTS.md** - See current status
2. **Check console logs** - Look for error messages
3. **Run test script** - Identifies specific API issues
4. **Check Google Cloud Console** - Verify APIs enabled
5. **Check billing** - Ensure billing is active

**Most common issue:** Forgetting to enable billing (even though it's free < $200)

---

## 📚 Related Documentation

- [QUICK_START.md](QUICK_START.md) - Fast setup guide
- [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) - Complete configuration
- [TEST_RESULTS.md](TEST_RESULTS.md) - Current test results
- [scripts/test-google-maps.js](scripts/test-google-maps.js) - Test script
- `components/dev/api-test-screen.tsx` - Former in-app test screen (component only)

---

**Last Updated:** 2025-12-17
**Test Status:** Configuration verified, APIs need to be enabled
**Next Step:** Enable billing and APIs in Google Cloud Console
