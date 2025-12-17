# Google Maps API Setup Guide for Rora

This guide will help you configure all Google Maps services for production use with your Rora ride-sharing app.

---

## 🔑 Step 1: Add Your API Key

### Option A: Using Environment Variables (Recommended for Production)

This app reads keys from Expo public env vars (and injects them into native builds via `app.config.ts`):

```bash
# Used by native map rendering (react-native-maps -> Maps SDK for iOS/Android)
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY_HERE"

# Used by Places Autocomplete + Place Details web service calls (recommended: only on backend/proxy)
export EXPO_PUBLIC_GOOGLE_PLACES_API_KEY="YOUR_GOOGLE_PLACES_API_KEY_HERE"

# Cloud Run proxy base URL (where your app will send Places/Directions/Distance Matrix requests)
export EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL="https://YOUR_CLOUD_RUN_SERVICE-xxxxx-uc.a.run.app"

# Shared secret (Bearer token) required by the proxy
export EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN="YOUR_LONG_RANDOM_TOKEN"
```

**Notes:**
- Don’t commit real keys to git. Treat them as secrets.
- For EAS builds, set these as EAS secrets / environment variables for the build profile.

### What happens at build time (Expo)

- `app.config.ts` sets:
  - iOS: `ios.config.googleMapsApiKey`
  - Android: `android.config.googleMaps.apiKey`

This is what `react-native-maps` uses to render Google maps on device.

---

## 🌐 Step 2: Enable Required Google Cloud APIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and enable these APIs:

### Required APIs:
1. **Maps SDK for iOS** - For iOS map rendering
2. **Maps SDK for Android** - For Android map rendering
3. **Places API** - For location autocomplete and place details
4. **Directions API** - For route calculation between points
5. **Distance Matrix API** - For distance/duration calculations
6. **Geocoding API** - For converting addresses to coordinates
7. **Maps JavaScript API** - For web support (optional)

### How to Enable:
1. Go to: https://console.cloud.google.com/apis/library
2. Search for each API above
3. Click "Enable" for each one

---

## 🔐 Step 3: Configure API Key Restrictions

### Application Restrictions:

**For iOS:**
- Restriction Type: `iOS apps`
- Bundle ID: Your app's bundle identifier (e.g., `com.rora.app`)

**For Android:**
- Restriction Type: `Android apps`
- Package Name: Your app's package name
- SHA-1 Certificate Fingerprint: Get from your keystore

**For Development/Testing:**
- You can temporarily use "None" but **change this before production**

### API Restrictions:

Restrict your key to only these APIs for security:
- Maps SDK for iOS
- Maps SDK for Android
- Places API
- Directions API
- Distance Matrix API
- Geocoding API

---

## 🗺️ Step 4: Verify Google Maps Configuration

### Current Configuration Status:

✅ **Packages Installed:**
- `react-native-maps@1.20.1` - Map rendering
- `react-native-google-places-autocomplete@2.6.1` - Places autocomplete

✅ **Platform Configuration:**
- iOS: `googleMapsApiKey` injected via `app.config.ts`
- Android: `googleMaps.apiKey` injected via `app.config.ts`
- Location permissions configured for both platforms

✅ **App Configuration:**
- API keys exported from [constants/config.ts](constants/config.ts)
- Sint Maarten location bounds configured
- 20km search radius for island coverage

---

## 🧪 Step 5: Test Each Service

### Test 1: Places Autocomplete
Navigate to `/location-picker` and type in the search fields:
- Should show suggestions as you type
- Should include Sint Maarten locations
- Should prioritize local results due to bias settings

**Test queries:**
- "Princess Juliana Airport"
- "Maho Beach"
- "Philipsburg"
- "Simpson Bay"

### Test 2: Place Details & Geocoding
Select a location from autocomplete:
- Should display full place name
- Should resolve to coordinates
- Should populate origin/destination in store

### Test 3: Route Calculation
After selecting origin and destination:
- Navigate to `/route-input`
- Should show loading state
- Should calculate route via the Cloud Run proxy (Directions API)
- Should display distance, duration, and price
- Should auto-navigate to `/trip-preview`

### Test 4: Map Rendering
On `/trip-preview` screen:
- Should display fullscreen map
- Should show origin marker (green)
- Should show destination marker (red)
- Should draw route polyline (green)
- Should fit map to show entire route

---

## 🔍 Current Implementation Details

### Places API Configuration
Location: [app/location-picker.tsx](app/location-picker.tsx:183-189)
```typescript
query={{
  key: GOOGLE_PLACES_API_KEY,
  language: "en",
  components: "country:sx",  // Restrict to Sint Maarten
  location: `${SINT_MAARTEN_LOCATION.latitude},${SINT_MAARTEN_LOCATION.longitude}`,
  radius: SEARCH_RADIUS,  // 20km radius
}}
```

**Features:**
- ✅ Biased to Sint Maarten (18.0425, -63.0548)
- ✅ 20km search radius covers entire island
- ✅ Country restriction to Sint Maarten (SX)
- ✅ Fetches full place details with coordinates
- ✅ 300ms debounce to reduce API calls

### Directions API Configuration
Location: [app/route-input.tsx](app/route-input.tsx)
```typescript
// Route is fetched via googleMapsService.getDirections(...) which calls the Cloud Run proxy,
// then we decode the returned overview_polyline to coordinates for <Polyline />.
```

**Features:**
- ✅ Calculates optimal route between points
- ✅ Returns polyline coordinates
- ✅ Provides distance in meters
- ✅ Provides duration in minutes
- ✅ Stores route data in Zustand for trip-preview

### Maps SDK Configuration
Location: [app/trip-preview.tsx](app/trip-preview.tsx)
```typescript
<MapView
  initialRegion={SINT_MAARTEN_REGION}
  showsUserLocation
  showsMyLocationButton={false}
>
  <Marker coordinate={origin.coordinates} pinColor={Colors.primary} />
  <Marker coordinate={destination.coordinates} pinColor="#FF5733" />
  <Polyline coordinates={routeData.coordinates} strokeColor={Colors.primary} />
</MapView>
```

**Features:**
- ✅ Fullscreen map display
- ✅ Custom marker colors
- ✅ Route polyline from stored coordinates
- ✅ Auto-fit to show entire route
- ✅ User location display

---

## 📊 Data Flow Summary

### Production-Ready Flow:

1. **User Input** → `/location-picker`
   - GooglePlacesAutocomplete shows suggestions
   - User selects origin and destination
   - Calls `setOrigin()` and `setDestination()` with full PlaceDetails
   - Includes: placeId, name, description, coordinates

2. **Route Calculation** → `/route-input`
   - Detects origin + destination in Zustand store
   - Calls `googleMapsService.getDirections()` (proxied)
   - Stores: distance, duration, price, polyline coordinates
   - Auto-navigates when ready

3. **Trip Preview** → `/trip-preview`
   - Validates routeData exists
   - Displays map with markers and polyline
   - Shows distance, duration, price in bottom sheet
   - User can confirm or edit route

---

## 🐛 Troubleshooting

### Issue: Autocomplete not showing suggestions
**Check:**
- API key is valid and Places API is enabled
- Network connection is working
- Check console for API error messages

---

## 🛡️ Recommended (Best Practice): Cloud Run Proxy for Web Service APIs

Google recommends not exposing web-service API keys in client apps; use a proxy server instead:
`https://developers.google.com/maps/api-security-best-practices`

This repo includes a deployable Cloud Run proxy at `maps-proxy/`.

### Deploy to Cloud Run (high level)

1. Build & deploy the container from `maps-proxy/` (Cloud Run).
2. Set Cloud Run env vars:
   - `GOOGLE_MAPS_WEB_SERVICE_KEY`: your **server-side** Maps web service key
   - `PROXY_TOKEN`: a long random token (your app sends this as `Authorization: Bearer ...`)
   - (Optional) `ALLOWED_ORIGINS`: comma-separated list of allowed origins (can be left empty for mobile)
3. Put the Cloud Run URL into:
   - `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL`
   - `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN`

### Which Google key goes where

- **Client (Expo app)**:
  - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: *native maps rendering only* (Maps SDK for iOS/Android)
  - `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL` + `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN`: to call your proxy
- **Server (Cloud Run)**:
  - `GOOGLE_MAPS_WEB_SERVICE_KEY`: used for Places/Directions/Distance Matrix web services
- Verify API key restrictions allow your app

**Fix:**
```bash
# Check if Places API is enabled
# Go to: https://console.cloud.google.com/apis/api/places-backend.googleapis.com
```

### Issue: Map not rendering
**Check:**
- Maps SDK for iOS/Android is enabled
- API key is in app.json for the platform
- Rebuild the app after changing app.json

**Fix:**
```bash
# For iOS
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios

# For Android
npx expo prebuild --clean
npx expo run:android
```

### Issue: Route calculation failing
**Check:**
- Directions API is enabled
- Both origin and destination have valid coordinates
- Check your Cloud Run proxy is reachable (`/health`)
- Check `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL` and `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN` are set in the app

**Fix:**
- Open the device logs and look for `[route-input] Directions error: ...`
- Confirm the proxy returns 200 for `GET /maps/directions` when called with a valid `Authorization: Bearer ...`

### Issue: Wrong locations being suggested
**Check:**
- Location bias is set correctly in query
- Country restriction is "country:sx"
- Search radius covers Sint Maarten

**Current Settings:**
- Center: 18.0425, -63.0548
- Radius: 20km (covers entire island)
- Country: SX (Sint Maarten)

---

## 💰 API Usage & Pricing

### Estimated Monthly Costs (1000 rides/month):

**Places Autocomplete:**
- ~3000 requests/month (3 per ride average)
- $0.00283 per request
- Cost: ~$8.49/month

**Place Details:**
- ~2000 requests/month (2 per ride)
- $0.017 per request
- Cost: ~$34/month

**Directions API:**
- ~1000 requests/month (1 per ride)
- $0.005 per request
- Cost: ~$5/month

**Maps SDK:**
- Dynamic Maps: $0.007 per load
- ~1000 loads/month
- Cost: ~$7/month

**Total Estimated:** ~$55/month for 1000 rides

Google provides $200 free credit per month, so you'll be within free tier initially.

---

## 📝 Security Best Practices

1. **Never commit API keys to git**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Restrict API keys**
   - Add application restrictions (iOS/Android)
   - Add API restrictions (only enable needed APIs)
   - Monitor usage in Google Cloud Console

3. **Use separate keys for development and production**
   - Development: Less restrictive for testing
   - Production: Fully restricted with bundle ID/package name

4. **Monitor API usage**
   - Set up billing alerts
   - Review quota usage regularly
   - Check for unusual spikes

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] API key added to `.env` or config files
- [ ] All 6 required APIs enabled in Google Cloud
- [ ] API key restrictions configured
- [ ] Places autocomplete working for Sint Maarten locations
- [ ] Route calculation working between two points
- [ ] Map displaying with markers and route polyline
- [ ] Distance and duration showing correctly
- [ ] Price calculation working
- [ ] Trip preview screen displaying all data
- [ ] Tested on both iOS and Android
- [ ] Location permissions granted
- [ ] No API errors in console
- [ ] Billing configured with alerts

---

## 📚 Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API Reference](https://developers.google.com/maps/documentation/places/web-service)
- [Directions API Reference](https://developers.google.com/maps/documentation/directions)
- [react-native-maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the console logs for error messages
2. Verify API key is valid: https://console.cloud.google.com/apis/credentials
3. Check API quota usage: https://console.cloud.google.com/apis/dashboard
4. Review this guide's troubleshooting section
5. Check react-native-maps issues: https://github.com/react-native-maps/react-native-maps/issues

---

**Last Updated:** 2025-12-16
**App Version:** 1.0.0
**Configuration Status:** ✅ Ready for API key insertion
