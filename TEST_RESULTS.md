# Google Maps API Test Results

**Test Date:** 2025-12-17
**API Key:** AIzaSyDnx60vHeQUMwgc... (configured ✅)

---

## 📋 Test Summary

| Test | Status | Issue |
|------|--------|-------|
| API Key Validation | ❌ Failed | Key exists but not properly configured |
| Places Autocomplete | ❌ Failed | Billing not enabled |
| Geocoding | ❌ Failed | API not enabled for this project |
| Reverse Geocoding | ❌ Failed | API not enabled for this project |
| Directions | ❌ Failed | Billing not enabled |
| Distance Matrix | ❌ Failed | Billing not enabled |

**Result:** 0 passed, 6 failed

---

## ⚠️ Issues Found

### 1. **Billing Not Enabled** (Critical)
```
Error: You must enable Billing on the Google Cloud Project
```

**What this means:**
Google Maps Platform requires a billing account to be linked to your project, even though you get $200 free credit per month.

**How to fix:**
1. Go to: https://console.cloud.google.com/billing
2. Link a billing account (credit card required)
3. You won't be charged until you exceed $200/month
4. For your usage (~1000 rides/month), estimated cost is ~$55/month
5. This is well within the $200 free tier

### 2. **APIs Not Enabled** (Critical)
```
Error: This API project is not authorized to use this API
```

**What this means:**
The required Google Maps APIs haven't been enabled for your project.

**How to fix:**
1. Go to: https://console.cloud.google.com/apis/library
2. Enable each of these APIs:
   - ✅ **Places API** - Search for "Places API", click Enable
   - ✅ **Geocoding API** - Search for "Geocoding API", click Enable
   - ✅ **Directions API** - Search for "Directions API", click Enable
   - ✅ **Distance Matrix API** - Search for "Distance Matrix API", click Enable
   - ✅ **Maps SDK for iOS** - Search for "Maps SDK for iOS", click Enable
   - ✅ **Maps SDK for Android** - Search for "Maps SDK for Android", click Enable

---

## 🔧 Quick Fix Steps

### Step 1: Enable Billing (5 minutes)

1. **Go to Google Cloud Console Billing:**
   ```
   https://console.cloud.google.com/billing
   ```

2. **Link Billing Account:**
   - Click "Link a billing account"
   - Add credit card details
   - Confirm billing setup

3. **Verify:**
   - You should see "Billing enabled" status
   - $200 monthly credit should be visible

### Step 2: Enable Required APIs (5 minutes)

Run these commands or use the links below:

```bash
# Direct links to enable each API:

# 1. Places API
open "https://console.cloud.google.com/apis/library/places-backend.googleapis.com"

# 2. Geocoding API
open "https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com"

# 3. Directions API
open "https://console.cloud.google.com/apis/library/directions-backend.googleapis.com"

# 4. Distance Matrix API
open "https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com"

# 5. Maps SDK for iOS
open "https://console.cloud.google.com/apis/library/maps-ios-backend.googleapis.com"

# 6. Maps SDK for Android
open "https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com"
```

**For each API:**
1. Click the link
2. Click "Enable" button
3. Wait 30 seconds for activation
4. Move to next API

### Step 3: Test Again (1 minute)

After enabling billing and APIs, run the test again:

```bash
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE node scripts/test-google-maps.js
```

You should see:
```
✅ Passed: 6
❌ Failed: 0
🎉 All tests passed!
```

---

## 📱 Testing in the App

Once the APIs are enabled, test the complete flow:

### Method 1: Use the In-App Test Screen

1. Start your app:
   ```bash
   npm start
   ```

2. Navigate to: (removed)

3. Tap "Run Tests" button

4. You should see all tests pass with green checkmarks

### Method 2: Test the Real Flow

1. Navigate to home screen
2. Tap "Search destination"
3. Type "Princess Juliana Airport" in pickup location
4. You should see autocomplete suggestions appear
5. Select the airport
6. Type "Maho Beach" in dropoff location
7. Select Maho Beach
8. Tap green "Continue" button
9. Route should be calculated automatically
10. You should see trip preview with:
    - Fullscreen map
    - Green marker at airport
    - Red marker at Maho Beach
    - Green route line connecting them
    - Distance, duration, and price in bottom sheet

---

## 📊 Expected Behavior After Fixing

### Places Autocomplete
- Type "Prin..." → Should suggest "Princess Juliana Airport"
- Type "Maho..." → Should suggest "Maho Beach"
- Type "Phil..." → Should suggest "Philipsburg"
- All suggestions should be from Sint Maarten
- Should appear within 1 second of typing

### Geocoding
- Selected place → Converts to coordinates
- Example: "Maho Beach" → (18.0485, -63.1204)
- Should resolve instantly

### Directions
- Airport → Maho Beach
- Distance: ~1.5 km
- Duration: ~3-5 minutes
- Should calculate within 2 seconds

### Map Display
- Should show Sint Maarten map
- Markers should be clearly visible
- Route polyline should connect markers
- Map should auto-zoom to fit route

---

## 💰 Cost Estimate (After Setup)

For 1000 rides per month:

| Service | Requests | Cost per Request | Monthly Cost |
|---------|----------|------------------|--------------|
| Places Autocomplete | 3,000 | $0.00283 | $8.49 |
| Place Details | 2,000 | $0.017 | $34.00 |
| Directions | 1,000 | $0.005 | $5.00 |
| Distance Matrix | 1,000 | $0.005 | $5.00 |
| Maps SDK | 1,000 | $0.007 | $7.00 |
| **Total** | | | **$59.49** |

**With $200 free credit:** You can handle ~3,350 rides per month for free!

---

## 🔐 Security Recommendations

After getting everything working:

1. **Add API Restrictions:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click your API key
   - Under "API restrictions", select "Restrict key"
   - Select only the 6 APIs you're using
   - Save

2. **Add Application Restrictions:**
   - For iOS: Add your bundle ID
   - For Android: Add package name + SHA-1 fingerprint
   - This prevents unauthorized use of your key

3. **Set Up Billing Alerts:**
   - Go to: https://console.cloud.google.com/billing/alerts
   - Create alert at $50, $100, $150
   - Get notified if usage spikes

4. **Monitor Usage:**
   - Go to: https://console.cloud.google.com/apis/dashboard
   - Check weekly for unusual patterns
   - Review quota usage

---

## ✅ Verification Checklist

Before considering setup complete:

- [ ] Billing enabled in Google Cloud Console
- [ ] All 6 APIs enabled
- [ ] Test script passes (all 6 tests green)
- [ ] (Optional) Dev component `src/features/dev/components/api-test-screen.tsx` shows all passing if wired into a route
- [ ] Can search for "Princess Juliana Airport" and see suggestions
- [ ] Can select origin and destination
- [ ] Route calculation works (sees loading → preview)
- [ ] Map displays with markers and route polyline
- [ ] Distance, duration, price showing correctly
- [ ] Tested on iOS (if applicable)
- [ ] Tested on Android (if applicable)
- [ ] API restrictions configured (recommended)
- [ ] Billing alerts set up (recommended)

---

## 🆘 Still Having Issues?

### If tests still fail after enabling billing/APIs:

1. **Wait 5-10 minutes** - API activation can take a few minutes
2. **Check project ID** - Make sure the API key is from the correct project
3. **Clear credentials** - In Google Cloud Console, regenerate the API key
4. **Check quotas** - Ensure you haven't hit any limits

### If some tests pass but others fail:

- Each API must be enabled individually
- Check which specific API is failing
- Go back and re-enable that specific API

### If app works but in-app test fails:

- The in-app test uses web API endpoints
- The app components use native SDKs (different configuration)
- Focus on the actual app flow working

### If you see "OVER_QUERY_LIMIT":

- You've exceeded free quota
- Check usage: https://console.cloud.google.com/apis/dashboard
- Either wait for reset or increase quota

---

## 📚 Additional Resources

- **Google Cloud Console:** https://console.cloud.google.com
- **API Dashboard:** https://console.cloud.google.com/apis/dashboard
- **Billing:** https://console.cloud.google.com/billing
- **API Library:** https://console.cloud.google.com/apis/library
- **Pricing Calculator:** https://cloud.google.com/products/calculator

---

## 🎯 Next Steps

1. ✅ **Enable billing** (required, won't be charged < $200/month)
2. ✅ **Enable all 6 APIs** (takes 5 minutes)
3. ✅ **Run test script again** to verify
4. ✅ **Test in app** with real flow
5. ⏭️ **Set up API restrictions** (security best practice)
6. ⏭️ **Set up billing alerts** (monitor usage)
7. ⏭️ **Deploy to production** when ready

**Estimated Time to Fix:** 10-15 minutes

**Status:** Ready to enable billing and APIs ✨
