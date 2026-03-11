# Header Overlap Checklist (Expo Router Stack)

Use this checklist to prevent **content rendering under the native header** or under the **status bar/notch**.

## Quick Triage

- **Native header visible?**
  - If the route is inside a `Stack` and you did **not** set `headerShown: false`, assume the native header is visible by default.
- **Using `headerTransparent: true`?**
  - If **yes**, the header becomes **absolutely positioned** and will overlap screen content unless you **manually offset** your UI.

## Checklist

- **If `headerTransparent: true` is enabled**
  - Add a top offset so your first content isn’t hidden under the header.
  - Recommended: use React Navigation’s header height (`useHeaderHeight()` / `HeaderHeightContext`) to compute `paddingTop` (or equivalent).

- **If you render a custom header in the screen (a “fake header”)**
  - Make it safe-area aware:
    - Use `useSafeAreaInsets()` and set `paddingTop: insets.top + <spacing>` on the header container, **or**
    - Wrap the top area in `SafeAreaView` with `edges` including `"top"`.
  - Avoid magic numbers like `paddingTop: 20` or absolute `top: 60`.

- **If you position buttons/overlays at the top (absolute positioning)**
  - Offset `top` by `insets.top` (or place the control inside a padded header container).

- **If you use `ScrollView` / `FlatList` with a transparent header**
  - Add `contentContainerStyle={{ paddingTop: <headerHeight> }}` so the first items aren’t hidden.

- **SafeAreaView edges sanity check**
  - Include `"top"` when you need content below the status bar/notch.
  - Exclude `"top"` only when you intentionally draw under system UI, or your layout already accounts for it.

## Minimal manual test

- iPhone with a notch (large `insets.top`)
- Android device/emulator (status bar differences)

Confirm:
- First content line is fully visible
- Back/close buttons are tappable and not under the status bar/header


