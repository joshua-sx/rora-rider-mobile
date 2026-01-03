# Adding New Features

## Development Flow

1. **Schema** → `supabase/migrations/` (SQL migrations)
2. **Types** → `npx supabase gen types typescript` → `types/database.ts`
3. **Edge Function** → `supabase/functions/` (if backend logic needed)
4. **Screen/Component** → `app/` (Expo Router) or `components/features/`
5. **State** → `store/` (Zustand store)
6. **Hooks** → `hooks/` (custom React hooks)
7. **Utilities** → `lib/` (helpers, pricing, maps, etc.)

## Data Flow

```
Screen/Component (React Native)
    ↓ Supabase client hook
Supabase Client (from lib/supabase)
    ↓ RPC call or direct query
Supabase Edge Function (if needed)
    ↓ validate state + permissions
Supabase PostgreSQL (with RLS)
    ↓ Realtime subscription
Component updates automatically
```

## Type Safety Pattern

```
Supabase Schema → `supabase gen types` → TypeScript types → Component
```

Types flow one direction. Never duplicate types manually.

## Guest Mode Pattern

```typescript
// Always check for guest token when user is not authenticated
const userId = session?.user?.id
const guestTokenId = await getGuestTokenId(deviceId)

// Store ride against appropriate identifier
const rideSession = await createRideSession({
  rider_user_id: userId || null,
  guest_token_id: userId ? null : guestTokenId,
  // ... other fields
})
```

## Definition of Done

A task is done only when:
- [ ] Acceptance criteria met
- [ ] App runs locally (iOS and Android)
- [ ] Typecheck and build pass
- [ ] Errors handled (no silent failures)
- [ ] Loading, empty, error states exist
- [ ] Ride state transitions validated server-side
- [ ] Ride event logged (for state changes)
- [ ] Guest mode works correctly (if applicable)
- [ ] Offline behavior handled (QR display, cached data)
- [ ] Changes make sense in 3 months
