# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Native integrations

This app includes several native-facing dependencies that may require config or device testing:

- Maps: `react-native-maps` + Google Maps web services.
  - Env vars: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`
  - Optional proxy: `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN`
  - Native keys are injected via `app.config.ts` for iOS/Android.
  - Setup/testing: `GOOGLE_MAPS_SETUP.md`, `TESTING_GUIDE.md`
- Location: `expo-location`
  - Permissions are declared in `app.json` (iOS/Android).
  - Testing flow: `LOCATION_PERMISSION_TEST_GUIDE.md`
- Blur: `expo-blur`
  - Used by the location permission modal; no extra native config required in Expo managed.
- QR: `react-native-qrcode-svg` (via `react-native-svg`)
  - Render-only QR codes; no camera or native permission requirements.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
