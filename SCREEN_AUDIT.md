# Screen Migration Audit - Issue #190

**Status**: In Progress
**Priority**: P0 Critical
**Branch**: `claude/fix-issue-190-p1hFC`

## Overview

Migrating all screens from legacy design tokens to the new design system defined in `/src/ui/`.

**References**:
- Design System Spec: `DESIGN_SYSTEM.md`
- Migration Guide: `src/ui/MIGRATION.md`
- Implementation Guide: `DESIGN_SYSTEM_IMPLEMENTATION.md`

## Token Mapping Reference

### Colors
| Old | New | Value |
|-----|-----|-------|
| `Colors.primary` | `colors.primary` | #00BE3C |
| `Colors.textSlate` | `colors.text` | #262626 |
| `Colors.neutralStone` | `colors.textMuted` | #5C5F62 |
| `Colors.canvasMist` | `colors.surface` | #F9F9F9 |
| `Colors.cardWhite` | `colors.bg` | #FFFFFF |
| `Colors.dividerMist` | `colors.border` | #E3E6E3 |
| `Colors.success` | `colors.success` | #00BE3C |
| `Colors.error` | `colors.danger` | #D14343 |
| `Colors.warning` | `colors.warning` | #E9A63A |

### Spacing
| Old | New | Value |
|-----|-----|-------|
| `Spacing.xs` | `space[1]` | 4px |
| `Spacing.sm` | `space[2]` | 8px |
| `Spacing.md` | `space[3]` | 12px |
| `Spacing.lg` | `space[4]` | 16px |
| `Spacing.xl` | `space[5]` | 20px |
| `Spacing.xxl` | `space[6]` | 24px |
| `Spacing.xxxl` | `space[7]` | 32px |

### Border Radius
| Old | New | Value |
|-----|-----|-------|
| `BorderRadius.sm` | `radius.sm` | 10px |
| `BorderRadius.md` | `radius.md` | 14px |
| `BorderRadius.button` | `radius.md` | 14px |
| `BorderRadius.card` | `radius.lg` | 18px |
| `BorderRadius.lg` | `radius.lg` | 18px |
| `BorderRadius.input` | `radius.sm` | 10px |
| `BorderRadius.sheet` | `radius.lg` | 18px |
| `BorderRadius.full` | `radius.pill` | 999px |

### Components
| Old | New |
|-----|-----|
| `<ThemedText>` | `<Text variant="...">` |
| `<ThemedView>` | `<Box>` |

## Group 1: Venue & Explore (5 files)

### 1. `app/(tabs)/explore/venue/[id].tsx`
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace `ThemedView` with `Box`
- [ ] Replace legacy tokens with new design system
- [ ] Test on iOS and Android

### 2. `app/(tabs)/explore/index.tsx`
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace `ThemedView` with `Box`
- [ ] Replace legacy tokens with new design system
- [ ] Test on iOS and Android

### 3. `app/(tabs)/explore/category/[slug].tsx`
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace `ThemedView` with `Box`
- [ ] Replace legacy tokens with new design system
- [ ] Test on iOS and Android

### 4. `app/(tabs)/explore/featured.tsx`
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace `ThemedView` with `Box`
- [ ] Replace legacy tokens with new design system
- [ ] Test on iOS and Android

### 5. `src/features/explore/components/*`
Multiple components to migrate:
- [ ] `category-chip.tsx` - Replace `ThemedText`
- [ ] `featured-venue-card.tsx` - Replace `ThemedText`
- [ ] `ride-cta-card.tsx` - Replace `ThemedText`
- [ ] `search-results.tsx` - Replace `ThemedText`
- [ ] `venue-header.tsx` - Replace `ThemedText`
- [ ] `venue-list-item.tsx` - Replace `ThemedText`

## Group 2: Driver Components (1 file)

### 1. `src/features/drivers/components/driver-card.tsx`
**Current Issues**:
- Uses `ThemedText` (3-4 instances)
- Uses `Spacing.*` tokens (padding, margins, gaps)
- Uses `BorderRadius.card`

**Migration Tasks**:
- [ ] Replace `ThemedText` with `Text` (variants: body, sub, cap)
- [ ] Replace `Spacing.lg` → `space[4]`
- [ ] Replace `Spacing.md` → `space[3]`
- [ ] Replace `Spacing.xs` → `space[1]`
- [ ] Replace `BorderRadius.card` → `radius.lg`
- [ ] Update imports to use `@/src/ui`
- [ ] Test rendering on iOS and Android

## Group 3: Trip Preview & Other Screens (4 files)

### 1. `app/trip-preview.tsx`
**Current Issues**:
- Heavy use of legacy tokens (50+ instances)
- Uses `ThemedText`
- Uses `ThemedView`
- Uses `Colors.primary`, `Spacing.*`, `BorderRadius.*`

**Migration Tasks**:
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace `ThemedView` with `Box`
- [ ] Replace all `Spacing.*` with `space[*]`
- [ ] Replace all `BorderRadius.*` with `radius.*`
- [ ] Replace `Colors.primary` with `colors.primary`
- [ ] Update imports
- [ ] Test full trip preview flow

### 2. `app/route-input.tsx`
**Current Issues**:
- Heavy use of legacy tokens (40+ instances)
- Uses `ThemedText`
- Uses `Colors.primary`, `Colors.surface`
- Uses `Spacing.*`, `BorderRadius.*`

**Migration Tasks**:
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace all `Spacing.*` with `space[*]`
- [ ] Replace all `BorderRadius.*` with `radius.*`
- [ ] Replace `Colors.*` with `colors.*`
- [ ] Update imports
- [ ] Test route input flow

### 3. `app/(tabs)/drivers.tsx`
**Current Issues**:
- Uses `ThemedText`
- Uses `Spacing.*` tokens

**Migration Tasks**:
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace `Spacing.*` with `space[*]`
- [ ] Update imports
- [ ] Test driver list screen

### 4. `app/driver/[id].tsx`
**Current Issues**:
- Heavy use of legacy tokens (30+ instances)
- Uses `ThemedText`
- Uses `Spacing.*`, `BorderRadius.*`

**Migration Tasks**:
- [ ] Replace `ThemedText` with `Text`
- [ ] Replace all `Spacing.*` with `space[*]`
- [ ] Replace all `BorderRadius.*` with `radius.*`
- [ ] Update imports
- [ ] Test driver detail screen

## Additional Files (Lower Priority)

### Supporting Components
- `src/features/home/components/location-permission-modal.tsx` - Heavy token usage
- `src/features/home/components/popular-locations.tsx` - Uses `ThemedText`
- `src/ui/legacy/popular-location-card.tsx` - Uses legacy tokens
- `src/ui/legacy/collapsible.tsx` - Uses legacy theme colors

### Other Screens
- `app/+not-found.tsx` - Uses `ThemedText`
- `app/modal.tsx` - Uses `ThemedText`

## Verification Checklist

After each file migration:
- [ ] No hardcoded colors remaining
- [ ] No legacy token imports (`Colors.*`, `Spacing.*`, `BorderRadius.*`)
- [ ] No `ThemedText` or `ThemedView` imports
- [ ] All imports from `@/src/ui` working
- [ ] `npx tsc --noEmit` passes
- [ ] Component renders correctly on iOS simulator
- [ ] Component renders correctly on Android emulator
- [ ] Visual regression check (screenshot comparison)

## Success Metrics

- [ ] Zero files using `Colors.*`, `Spacing.*`, `BorderRadius.*`
- [ ] Zero files using `ThemedText` or `ThemedView`
- [ ] All screens using design system from `@/src/ui`
- [ ] Type checks pass
- [ ] No visual regressions
- [ ] All acceptance criteria met

## Notes

- Follow the patterns in `DESIGN_SYSTEM_IMPLEMENTATION.md`
- Reference `src/ui/MIGRATION.md` for component equivalents
- Test thoroughly on both platforms after each group
- Commit after each group completion
