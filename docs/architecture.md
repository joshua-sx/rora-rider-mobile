# Architecture Overview

## Tech Stack

- Frontend: Expo / React Native + TypeScript
- State: Zustand
- Database: Supabase PostgreSQL
- Auth: Supabase Auth (SMS OTP + Email magic link)
- Maps: Google Maps (react-native-maps)
- Real-time: Supabase Realtime
- Backend: Supabase Edge Functions
- Push: Expo Push Notifications

## Key Architectural Decisions

1. **Guest mode** with rate limiting (5 QRs/hour) and token-based history
2. **QR session system** with JWT tokens (short-lived, revocable)
3. **Discovery wave system** (favorited → nearby → expanded radius)
4. **Append-only ride events ledger** for audit trail
5. **Cash-first, negotiation-friendly** (drivers can counter Rora Fare)
6. **Privacy-first location storage** (coordinates + coarse labels)

## Codebase Structure

The project follows a src-based structure:

- `app/` - Expo Router screens and layouts
  - `(auth)/` - Authentication screens
  - `(tabs)/` - Main app tabs
- `src/`
  - `components/` - React Native components
  - `features/` - Feature-specific logic and components
  - `services/` - External service integrations (Google Maps, etc.)
  - `store/` - Zustand state management
  - `types/` - TypeScript type definitions
  - `ui/` - Reusable UI components
  - `utils/` - Utility functions
- `supabase/`
  - `migrations/` - Database migrations
  - `functions/` - Edge Functions

For detailed file structure, run `tree -L 3 -I 'node_modules|.git'` or explore the codebase.
