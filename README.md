<p align="center">
	<h1 align="center"><b>Rora Ride</b></h1>
<p align="center">
    Find Verified Taxis. Transparent Fares. Safe Rides.
    <br />
    <br />
    <a href="https://github.com/joshua-sx/rora-ride/issues">Issues</a>
  </p>
</p>

<p align="center">
  <a href="https://supabase.com">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </a>
  <a href="https://expo.dev">
    <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  </a>
  <a href="https://reactnative.dev">
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  </a>
</p>

## About Rora Ride

Rora Ride helps riders (especially tourists) **find verified taxis**, **see transparent fare estimates**, and **log rides safely** using a **QR handshake** between rider and driver. Built for Sint Maarten's taxi ecosystem, Rora respects real-world norms: cash-first culture, price negotiation, and trust through verification.

The Rora Fare is a single authoritative price anchor aligned with government and taxi association rates. Drivers may accept, counter, or decline. Rora provides price clarity without price control.

## Features

**Verified Taxi Directory**: Browse verified drivers with service area tags, vehicle capacity, languages spoken, and verification badges.<br/>
**Transparent Fare Estimates**: Get the Rora Fare—a single price anchor based on zone and distance pricing, aligned with official rates.<br/>
**QR Ride Sessions**: Generate a QR code to broadcast your ride request to nearby drivers or request a specific driver directly.<br/>
**Smart Discovery**: Drivers respond with Accept or Counter offers. Compare multiple offers with price context labels (Good deal, Pricier than usual).<br/>
**Guest Mode**: Use the app without an account for browsing and ride requests (rate-limited). Claim your history after signup.<br/>
**Ride History**: Track your completed rides with full details, driver info, and the ability to favorite drivers for future requests.<br/>

## Get started

We are working on comprehensive documentation. For local development setup, see [LOCAL_DEV.md](./LOCAL_DEV.md).

### Quick Start

```bash
# Clone the repository
git clone https://github.com/joshua-sx/rora-ride.git
cd rora-ride

# Install dependencies
npm install
# or
yarn install

# Set up Supabase local development
npx supabase init
npx supabase start  # Requires Docker
# Copy the anon key from the output to .env.local

# Set up environment variables
cp .env.example .env.local  # If .env.example exists
# Edit .env.local with your Supabase credentials, Google Maps API key, etc.
# Required variables:
#   EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>

# Test Supabase connection
node scripts/test-supabase-connection.js

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## App Architecture

- **Framework**: Expo / React Native
- **Language**: TypeScript
- **State Management**: Zustand (or similar)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (SMS OTP + Email magic link)
- **Maps**: Google Maps (react-native-maps)
- **Real-time**: Supabase Realtime
- **Push Notifications**: Expo Push Notifications
- **QR Generation**: QR code library
- **Backend Logic**: Supabase Edge Functions

### Hosting

- **Supabase** (database, auth, realtime, edge functions)
- **Expo EAS** (app builds and distribution)
- **App Store / Play Store** (native app distribution)

### Services

- **GitHub Actions** (CI/CD)
- **PostHog** (analytics - self-hosted)
- **Sentry** (error tracking)
- **Twilio** (SMS OTP)

## Security & Privacy

Rora Ride is built with security and privacy in mind:

- **Verified drivers**: All drivers baseline verified through government and/or taxi association onboarding
- **JWT tokens**: Short-lived, revocable tokens for QR sessions
- **Audit trail**: Append-only ride events ledger for accountability
- **Privacy-first**: Store coordinates and coarse labels; avoid full address strings
- **Guest mode**: Rate-limited guest access with secure token management

## Project Structure

```
rora-ride/
├── app/                        # Expo Router app directory
│   ├── (auth)/                 # Authentication screens
│   ├── (tabs)/                 # Main app tabs
│   └── _layout.tsx             # Root layout
├── components/                 # React Native components
│   ├── features/               # Feature-specific components
│   └── ui/                     # Reusable UI components
├── lib/                        # Utilities and helpers
│   ├── supabase/               # Supabase client & helpers
│   ├── maps/                   # Maps integration
│   └── pricing/                # Pricing calculation logic
├── hooks/                      # React hooks
├── store/                      # State management (Zustand)
├── types/                      # TypeScript types
├── supabase/                   # Supabase config & migrations
│   ├── migrations/             # Database migrations
│   └── functions/              # Edge Functions
├── scripts/                    # Build & utility scripts
└── docs/                       # Documentation
```

## Development

```bash
# Start Expo development server
npx expo start

# Start with iOS simulator
npx expo start --ios

# Start with Android emulator
npx expo start --android

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for production
eas build --profile production --platform all
```

## Database

### Supabase Setup

Rora Ride uses Supabase for the database, authentication, and real-time features.

**Initial Setup:**
```bash
# Install Supabase CLI (already included as dev dependency)
# Initialize Supabase in your project
npx supabase init

# Start local Supabase instance (requires Docker)
npx supabase start

# Copy the anon key from the output and add to .env.local:
# EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-output>

# Test the connection
node scripts/test-supabase-connection.js
```

**Development Workflow:**
```bash
# Create a new migration
npx supabase migration create <migration-name>

# Apply migrations locally
npx supabase db reset

# Generate TypeScript types from database schema
npx supabase gen types typescript --local > src/types/database.ts

# Open Supabase Studio (web UI for database management)
npx supabase studio

# Stop local Supabase
npx supabase stop
```

**Linking to Cloud Project (Optional):**
```bash
# Link to your Supabase cloud project
npx supabase link --project-ref <your-project-ref>

# Pull remote migrations
npx supabase db pull
```

**Supabase Client:**
The Supabase client is initialized in `src/lib/supabase.ts` and automatically configured from environment variables.

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/e55f0c74b33085545ccf3410aae537fa0cd917af.svg "Repobeats analytics image")

## License

License is not finalized yet. If you plan to deploy Rora Ride commercially, please open an issue to discuss licensing.

## Market & Target

**Primary Market**: Sint Maarten (Dutch side initially, expanding to French side)  
**Target Users**: Tourists, visitors, and locals seeking verified taxi transportation  
**Driver App**: Separate product (not included in this repository)

## Core Workflow

1. **Estimate** → Rider selects origin and destination, sees Rora Fare
2. **Generate QR** → Create ride session with QR code
3. **Discover** → Broadcast to nearby drivers or request specific driver
4. **Compare Offers** → Review driver responses (Accept/Counter)
5. **Confirm** → Select driver and proceed with ride
6. **Complete** → Mark ride complete, rate driver (optional), save to history

For detailed specifications, see [SPEC.md](./SPEC.md).
