# 🚀 Quick Start - Add Your Google Maps API Key (Secure)

## Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key or use an existing one
3. Copy your API key

## Step 2: Add to Your App (Recommended: Environment Variables)

### Environment Variables (Recommended)

This project is configured to read keys from Expo env vars (no keys committed to git):

1. Export env vars in your shell (or your IDE run configuration):

```bash
export EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"
export EXPO_PUBLIC_GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"
```

2. Start Expo from the same shell session:

```bash
npm start
```

Notes:
- `EXPO_PUBLIC_...` vars are available to the JS bundle (Expo convention).
- Native Maps keys for iOS/Android are injected via `app.config.ts` from the same env vars.

## Step 3: Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/apis/library) and enable:

1. **Places API** - For autocomplete ✅
2. **Directions API** - For routes ✅
3. **Maps SDK for iOS** - For iOS maps ✅
4. **Maps SDK for Android** - For Android maps ✅
5. **Distance Matrix API** - For calculations ✅
6. **Geocoding API** - For coordinates ✅

## Step 4: Test Your Setup

1. Start the app:
   ```bash
   npm start
   ```

2. Navigate to the location picker screen: `/location-picker`

3. Type a location in Sint Maarten:
   - "Princess Juliana Airport"
   - "Maho Beach"
   - "Philipsburg"

4. You should see autocomplete suggestions appear
5. Select origin + destination → the green Continue button appears
6. Continue → route is calculated → trip preview shows the map/route

## ✅ You're Done!

Your app is now configured with:
- ✅ Places Autocomplete (typing suggestions)
- ✅ Geocoding (address → coordinates)
- ✅ Directions API (route calculation)
- ✅ Maps SDK (map rendering)
- ✅ Sint Maarten location bias (20km radius)
- ✅ Country restriction (Sint Maarten only)

---

## 📖 Need More Details?

See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for:
- Complete configuration guide
- API restrictions setup
- Troubleshooting tips
- Cost estimates
- Security best practices

---

## 🐛 Troubleshooting

**Autocomplete not working?**
- Check API key is valid
- Verify Places API is enabled
- Check console for errors

**Map not showing?**
- Enable Maps SDK for iOS/Android
- Rebuild app: `npx expo prebuild --clean`
- Check app.json has API key

**Getting API errors?**
- Check API key restrictions
- Verify billing is enabled
- Check quota limits

---

**Questions?** See the full guide: [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md)
