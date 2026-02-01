# Project Structure

This repository uses Expo Router for navigation and a feature-first layout for everything else. The goal is to keep `app/` focused on routing concerns and put reusable UI, domain logic, and services in `src/`.

## Top-level rules

- **`app/` is for routes only.** Keep route shells, layouts, and screen wiring here.
- **Feature code lives in `src/features/`.** Each feature owns its UI, hooks, data, and helpers.
- **Shared UI lives in `src/ui/`.** Design system primitives and cross-feature components only.
- **Side effects live in `src/services/`.** API clients, SDK wrappers, native integrations.
- **Global state lives in `src/store/`.** Zustand stores and persistence helpers.
- **Shared utilities live in `src/utils/`.** Formatting, validation, small helpers.
- **Shared types live in `src/types/`.** Used across features and services.
- **Shared constants live in `src/constants/`.** Tokens, enums, static maps.

## Recommended directory layout

- app/                      # Expo Router routes, layouts, and route-only screens
- src/
-   features/               # Domain slices
-     booking/
-       components/
-       src/hooks/
-       screens/
-       data/
-     drivers/
-       components/
-       screens/
-     explore/
-       components/
-       screens/
-       data/
-     location/
-       src/hooks/
-       src/services/
-       screens/
-   ui/                      # Design system and shared UI
-     components/
-     providers/
-     styles/
-   src/services/                # API clients, SDK wrappers, native integrations
-   src/store/                   # Zustand stores
-   src/hooks/                   # Shared hooks (not feature-specific)
-   src/utils/                   # Helpers and utilities
-   src/constants/               # Tokens, enums, static maps
-   src/types/                   # Shared types

## Mapping examples

- `app/(tabs)/index.tsx` -> route shell that renders `src/features/home/screens/HomeScreen.tsx`
- `src/features/drivers/components/driver-card` -> `src/features/drivers/components/DriverCard.tsx` if feature-specific
- `components/themed-*` -> `src/ui/components/`
- `src/services/location.service.ts` -> `src/services/location.service.ts`
- `src/store/location-store.ts` -> `src/store/location-store.ts`
- `src/features/explore/data/venues` -> `src/features/explore/src/features/explore/src/features/explore/data/venues.ts` if mock-only, or `src/services/venues.service.ts` if API-backed

## Route file pattern

Keep route files thin and declarative. Example:

```tsx
// app/(tabs)/drivers.tsx
import DriversScreen from "@/src/features/drivers/screens/DriversScreen";

export default function DriversRoute() {
  return <DriversScreen />;
}
```

## When to add a new feature

Create a new feature folder when any of these are true:

- The UI spans multiple screens.
- The feature has its own data or API layer.
- You expect the area to evolve or be staffed independently.

## Naming conventions

- Components: `PascalCase.tsx`
- Hooks: `useFeatureThing.ts`
- Services: `thing.service.ts`
- Stores: `thing-store.ts`
- Data: `thing.data.ts` or `thing.mock.ts`

## Notes

- `app/` can import from `src/`, but `src/` should not import from `app/`.
- Prefer feature-local src/hooks/components when they are not reused elsewhere.
- Keep the design system minimal: if a component is only used in one feature, keep it there.
