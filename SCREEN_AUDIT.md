# Screen Structure & UX Audit
**Date:** 2026-01-04  
**Focus:** Design consistency, tab bar overlap, button copywriting, and UX flow analysis

---

## Executive Summary

### Critical Issues Found
1. **Tab Bar Overlap** - Buttons behind tab bar on venue detail screen
2. **Inconsistent Button Copy** - Multiple variations of similar actions
3. **Convoluted UX Flow** - Too many steps from explore → ride booking
4. **Design System Inconsistency** - Mix of old and new UI components

### Recommendations Priority
- **P0 (Critical):** Fix tab bar overlap immediately
- **P1 (High):** Standardize button copywriting
- **P2 (Medium):** Simplify explore → ride flow
- **P3 (Low):** Migrate remaining screens to design system

---

## 1. Tab Bar Overlap Issues

### Issue: Buttons Behind Tab Bar

**Affected Screen:** `app/venue/[id].tsx`

**Problem:**
```tsx
// Line 34: RideCtaCard uses bottom: tabBarHeight
<View style={[styles.container, { backgroundColor, bottom: tabBarHeight }]}>
```

**Root Cause:**
- `RideCtaCard` is positioned absolutely with `bottom: tabBarHeight`
- However, the ScrollView content padding (line 232) adds `height: getTabBarHeight(insets) + 160`
- This creates a gap, but the button itself may still overlap on some devices
- The calculation doesn't account for the card's own height (padding + content + button)

**Current Implementation:**
```tsx
// venue/[id].tsx line 232
<View style={{ height: getTabBarHeight(insets) + 160 }} />

// ride-cta-card.tsx line 34
<View style={[styles.container, { backgroundColor, bottom: tabBarHeight }]}>
```

**Fix Required:**
1. Ensure `RideCtaCard` accounts for its own height
2. Add proper safe area insets to the card
3. Verify on multiple device sizes

**Recommended Fix:**
```tsx
// In ride-cta-card.tsx
const cardHeight = 16 + 16 + 60 + 16 + 52; // padding + title + meta + gap + button ≈ 160px
const totalBottom = tabBarHeight + insets.bottom;

<View style={[
  styles.container, 
  { 
    backgroundColor, 
    bottom: totalBottom,
    paddingBottom: Math.max(insets.bottom, 16) // Extra safe area padding
  }
]}>
```

---

## 2. Button Copywriting Audit

### Current Button Labels

| Screen | Button Label | Context | Issue |
|--------|-------------|---------|-------|
| `venue/[id].tsx` | "Set pickup location" | Sticky CTA card | ❌ Unclear action - sounds like a setting |
| `ride-cta-sheet.tsx` | "Get Official Quote & View Drivers" | Bottom sheet CTA | ❌ Too long, wordy |
| `driver/[id].tsx` | "Book Ride" | Driver profile | ✅ Clear and concise |
| `driver/[id].tsx` | "Driver Off Duty" | Disabled state | ✅ Clear |
| `BookingOptionsSheet` | "Book New Ride" | Modal option | ✅ Clear |
| `BookingOptionsSheet` | "Use Saved Trip" | Modal option | ⚠️ Could be "Use Saved Trip" vs "Book Saved Trip" |
| `trip-preview.tsx` | "Find Driver" | Trip preview | ⚠️ Ambiguous - find or book? |
| `favorite-drivers.tsx` | "Book Ride" | Driver list | ✅ Clear |

### Copywriting Issues

#### Issue 1: "Set pickup location" (Venue Detail)
**Current:** "Set pickup location"  
**Problem:** 
- Sounds like a configuration step, not an action
- Doesn't indicate what happens next
- Users might think it's just setting a preference

**Recommended:** 
- **Option A:** "Get a ride" (simple, matches header text)
- **Option B:** "Book ride to [venue name]" (more specific)
- **Option C:** "Request ride" (action-oriented)

**Winner:** "Get a ride" - matches the header "Get a ride to {venue.name}" and is action-oriented

#### Issue 2: "Get Official Quote & View Drivers" (Ride CTA Sheet)
**Current:** "Get Official Quote & View Drivers"  
**Problem:**
- Too long (35 characters)
- "Official" is unnecessary marketing speak
- "& View Drivers" is redundant - they'll see drivers anyway
- Doesn't fit well on smaller screens

**Recommended:**
- **Option A:** "Get quote" (short, clear)
- **Option B:** "See fare & drivers" (descriptive)
- **Option C:** "Continue" (generic but works)

**Winner:** "See fare & drivers" - descriptive, under 20 chars, tells user what they'll get

#### Issue 3: "Find Driver" (Trip Preview)
**Current:** "Find Driver"  
**Problem:**
- Ambiguous - are we searching or booking?
- Doesn't match the actual flow (which goes to driver directory)

**Recommended:**
- **Option A:** "Browse drivers" (matches navigation)
- **Option B:** "Find a driver" (slightly clearer)
- **Option C:** "View drivers" (matches what happens)

**Winner:** "Browse drivers" - matches the tab name and user expectation

### Standardized Button Copy Guide

**Primary Actions:**
- "Book ride" - When booking with a specific driver
- "Get a ride" - When starting ride request from venue/explore
- "See fare & drivers" - When showing pricing and driver options
- "Continue" - Generic progression (use sparingly)

**Secondary Actions:**
- "Use saved trip" - When selecting from saved trips
- "Cancel" - Dismissal actions
- "Edit pickup" - Modifying location

**Disabled States:**
- "Driver off duty" - Clear reason for disabled state
- "Select pickup first" - Guide user to required action

---

## 3. UX Flow Analysis: Explore → Venue → Ride

### Current Flow

```
1. Explore Tab
   ↓
2. Browse venues / Search
   ↓
3. Tap venue card
   ↓
4. Venue Detail Screen
   - Shows: Header, About, Hours, Map, Sticky CTA
   ↓
5. Tap "Set pickup location" (RideCtaCard)
   ↓
6. RideCtaSheet (Bottom Sheet)
   - Shows: Pickup (Current Location), Destination (Locked), Route preview
   ↓
7. Tap "Get Official Quote & View Drivers"
   ↓
8. trip-preview.tsx
   - Shows: Map, Route, Fare, QR code
   ↓
9. Tap "Find Driver"
   ↓
10. Drivers Tab (or driver directory)
```

### Problems with Current Flow

#### Problem 1: Too Many Steps (5 taps minimum)
- **Ideal:** 2-3 taps from venue to booking
- **Current:** 5+ taps
- **Impact:** High drop-off rate, user frustration

#### Problem 2: Unclear Value Proposition
- Step 5-6: User doesn't know what "Set pickup location" does
- Step 7: "Get Official Quote" sounds like a separate action
- Step 9: "Find Driver" doesn't indicate booking

#### Problem 3: Context Loss
- User starts in Explore, ends in Drivers tab
- No clear indication of progress
- Hard to go back to venue details

#### Problem 4: Redundant Information
- Venue detail shows distance/duration
- RideCtaSheet shows same info again
- trip-preview shows it a third time

### Recommended Flow (Simplified)

```
1. Explore Tab
   ↓
2. Browse venues / Search
   ↓
3. Tap venue card
   ↓
4. Venue Detail Screen
   - Sticky CTA: "Get a ride" (single button)
   ↓
5. Tap "Get a ride"
   ↓
6. RouteEstimateScreen (Full screen, not sheet)
   - Auto-fills: Current location → Venue
   - Shows: Route, Fare estimate
   - CTA: "Continue to drivers"
   ↓
7. DiscoveryScreen or OffersListScreen
   - Shows: Available drivers with offers
   - User can: Accept offer or browse more
```

**Benefits:**
- Reduced from 5+ taps to 3 taps
- Clear progression: Venue → Route → Drivers
- Less context switching
- Single source of truth for route info

### Alternative: Inline Booking (Even Simpler)

```
1. Venue Detail Screen
   - Inline section: "Get a ride"
   - Shows: Quick fare estimate (if location available)
   - CTA: "Book ride" (single button)
   ↓
2. RouteEstimateScreen (if pickup needs editing)
   OR
   DiscoveryScreen (if pickup is current location)
```

**Benefits:**
- 1-2 taps maximum
- Immediate action
- Less cognitive load

---

## 4. Design System Consistency

### Component Usage Audit

#### ✅ Using Design System
- `src/ui/components/Button` - Used in ride-cta-sheet, BookingOptionsSheet
- `src/ui/primitives/Text` - Used in ride-cta-sheet
- `src/ui/primitives/Box` - Used in ride-cta-sheet

#### ❌ Not Using Design System
- `venue/[id].tsx` - Uses `ThemedText`, `ThemedView` (old system)
- `RideCtaCard` - Custom styled component (should use Button)
- `trip-preview.tsx` - Mix of old and new components

### Migration Priority

**High Priority (User-facing):**
1. `venue/[id].tsx` - High traffic screen
2. `RideCtaCard` - Prominent CTA component
3. `trip-preview.tsx` - Core booking flow

**Medium Priority:**
4. `driver/[id].tsx` - Driver profiles
5. `route-input.tsx` - Route planning

**Low Priority:**
6. Settings screens
7. Profile screens

### Design Token Usage

**Current Issues:**
- Hardcoded colors: `#FFFFFF`, `#161616`, `#00BE3C`
- Hardcoded spacing: `20`, `16`, `12`
- Inconsistent border radius: `12`, `16`, `20`

**Should Use:**
- Colors: `colors.bg`, `colors.surface`, `colors.primary`
- Spacing: `space[4]`, `space[5]`, `space[6]`
- Radius: `radius.md`, `radius.lg`

---

## 5. Screen Structure Analysis

### Screen Inventory

#### Tab Screens (Always visible tab bar)
1. ✅ `(tabs)/index.tsx` - Home (map + bottom sheet)
2. ✅ `(tabs)/explore/index.tsx` - Explore search
3. ✅ `(tabs)/explore/featured.tsx` - Featured venues
4. ✅ `(tabs)/explore/category/[slug].tsx` - Category listing
5. ⚠️ `venue/[id].tsx` - **HAS OVERLAP ISSUE**
6. ✅ `(tabs)/drivers.tsx` - Drivers directory
7. ✅ `(tabs)/profile.tsx` - Profile

#### Modal/Stack Screens (No tab bar)
8. ✅ `route-input.tsx` - Route planning
9. ✅ `trip-preview.tsx` - Trip preview
10. ✅ `driver/[id].tsx` - Driver profile
11. ✅ `settings/index.tsx` - Settings
12. ✅ `trip-history.tsx` - Trip history
13. ✅ `saved-locations.tsx` - Saved locations

### Tab Bar Height Calculation

**Current Implementation:**
```tsx
// src/utils/safe-area.ts
export function getTabBarHeight(insets: EdgeInsets): number {
  const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 49 : 60;
  return TAB_BAR_BASE_HEIGHT + insets.bottom;
}
```

**Usage Patterns:**
- ✅ Home screen: Passes `bottomInset={tabBarHeight}` to bottom sheet
- ✅ Profile screen: Adds padding `height: tabBarHeight + space[4]`
- ⚠️ Venue detail: Uses `bottom: tabBarHeight` but may not account for card height
- ✅ Explore index: Adds padding `height: tabBarHeight + 20`

**Recommendation:**
Create a reusable hook or component for sticky bottom CTAs:

```tsx
// src/hooks/use-sticky-cta.ts
export function useStickyCta(cardHeight: number = 160) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);
  const totalBottom = tabBarHeight + insets.bottom;
  
  return {
    bottom: totalBottom,
    paddingBottom: Math.max(insets.bottom, 16),
    scrollPadding: totalBottom + cardHeight + 20,
  };
}
```

---

## 6. Recommendations Summary

### Immediate Actions (P0)

1. **Fix Tab Bar Overlap**
   - Update `RideCtaCard` to properly account for safe area
   - Test on iPhone X, iPhone 14 Pro, Android devices
   - Add visual regression tests

2. **Standardize Button Copy**
   - Change "Set pickup location" → "Get a ride"
   - Change "Get Official Quote & View Drivers" → "See fare & drivers"
   - Change "Find Driver" → "Browse drivers"

### Short-term (P1)

3. **Simplify Explore → Ride Flow**
   - Remove intermediate `RideCtaSheet` step
   - Navigate directly to `RouteEstimateScreen`
   - Pre-fill destination from venue

4. **Migrate to Design System**
   - Update `venue/[id].tsx` to use new components
   - Replace `RideCtaCard` with design system Button
   - Remove hardcoded colors/spacing

### Medium-term (P2)

5. **Create Reusable CTA Components**
   - `StickyCtaCard` - For tab screens with bottom CTAs
   - `StickyCtaButton` - Simplified version for single actions

6. **Add Progress Indicators**
   - Show progress in explore → ride flow
   - "Step 1 of 3" indicators
   - Back navigation with context preservation

### Long-term (P3)

7. **A/B Test Flow Variations**
   - Test inline booking vs. multi-step flow
   - Measure conversion rates
   - Optimize based on data

---

## 7. Testing Checklist

### Tab Bar Overlap Testing
- [ ] iPhone X (safe area bottom: 34px)
- [ ] iPhone 14 Pro (safe area bottom: 34px)
- [ ] iPhone SE (no safe area)
- [ ] Android devices (various safe areas)
- [ ] Landscape orientation
- [ ] Keyboard visible state

### Button Copy Testing
- [ ] User testing: Do users understand "Get a ride"?
- [ ] Accessibility: Screen reader announces button correctly
- [ ] Localization: Text fits in other languages

### Flow Testing
- [ ] Measure tap count from explore to booking
- [ ] Track drop-off rates at each step
- [ ] Test back navigation preserves context

---

## 8. Implementation Plan

### Phase 1: Critical Fixes (Week 1)
1. Fix tab bar overlap in `RideCtaCard`
2. Update button copy in 3 locations
3. Test on all device sizes

### Phase 2: Flow Simplification (Week 2)
1. Remove `RideCtaSheet` intermediate step
2. Update navigation to go directly to `RouteEstimateScreen`
3. Pre-fill destination from venue context

### Phase 3: Design System Migration (Week 3)
1. Migrate `venue/[id].tsx` to new components
2. Replace `RideCtaCard` with design system Button
3. Remove all hardcoded values

### Phase 4: Polish (Week 4)
1. Add progress indicators
2. Improve error states
3. Add loading skeletons

---

## Appendix: Button Copy Reference

### Primary CTAs (Action-oriented)
- "Book ride" - Booking with specific driver
- "Get a ride" - Starting ride request
- "See fare & drivers" - Viewing pricing and options
- "Continue" - Generic progression (use sparingly)

### Secondary Actions
- "Use saved trip" - Selecting from saved
- "Edit pickup" - Modifying location
- "Cancel" - Dismissal

### Disabled States
- "Driver off duty" - Clear reason
- "Select pickup first" - Guide to action

### Avoid
- ❌ "Set pickup location" - Sounds like settings
- ❌ "Get Official Quote & View Drivers" - Too long
- ❌ "Find Driver" - Ambiguous
- ❌ "Request ride" - Less clear than "Get a ride"

---

# Part 2: Design Spec Compliance Audit

**Added:** 2026-01-04
**Spec Reference:** [DESIGN_SPEC.md](DESIGN_SPEC.md)

This section audits screens against the new design specification.

---

## Executive Summary (Design Spec)

### Critical Findings

| Category | Status | Description |
|----------|--------|-------------|
| **Color System** | ❌ Critical | Two competing systems. Ride flow uses iOS blue (#007AFF), rest uses Rora green (#00BE3C). Spec requires teal (#14B8A6) |
| **Typography** | ⚠️ Mixed | Profile uses token system; other screens use hardcoded sizes |
| **Spacing** | ⚠️ Mixed | Some screens use tokens (space[4]), others use magic numbers |
| **Components** | ⚠️ Mixed | Design system components exist but aren't used consistently |
| **Templates** | ❌ Missing | Screen templates from spec not implemented as reusable patterns |
| **States** | ⚠️ Partial | Some screens have loading states; empty/error states inconsistent |
| **Navigation** | ⚠️ Mixed | Tab structure exists but differs from spec (4 tabs vs spec's 5) |

### Compliance Score: 35/100

---

## 9. Color System Audit

### Current State

**Three color palettes in use:**

| Location | Primary | Purpose |
|----------|---------|---------|
| `src/ui/tokens/colors.ts` | `#00BE3C` (Rora Green) | Design system tokens |
| Ride flow screens | `#007AFF` (iOS Blue) | Hardcoded in styles |
| DESIGN_SPEC.md | `#14B8A6` (Teal) | New spec requirement |

### Violations

| Screen | Issue | Spec Requirement |
|--------|-------|------------------|
| [RouteEstimateScreen.tsx](src/features/ride/screens/RouteEstimateScreen.tsx) | Uses `#007AFF` for buttons, fare, loading | Should use `teal-500` (#14B8A6) |
| [LoginScreen.tsx](src/features/auth/screens/LoginScreen.tsx) | Uses `#007AFF` throughout | Should use `teal-500` (#14B8A6) |
| [DriversScreen](app/(tabs)/drivers.tsx) | Uses `useThemeColor` tint (varies) | Should use explicit teal-500 |
| [ExploreScreen](app/(tabs)/explore/index.tsx) | Uses `useThemeColor` tint | Should use explicit teal-500 |

### Spec vs Current

| Token | Spec Value | Current Value | Match |
|-------|------------|---------------|-------|
| Primary | `#14B8A6` (teal) | `#00BE3C` (green) | ❌ No |
| Background | `#FFFFFF` | `#FFFFFF` | ✅ Yes |
| Surface | `#F9FAFB` (gray-50) | `#F9F9F9` | ⚠️ Close |
| Text | `#111827` (gray-900) | `#262626` | ⚠️ Close |
| Text Muted | `#6B7280` (gray-500) | `#5C5F62` | ⚠️ Close |

### Recommendation
**Update `colors.ts` to match spec, then fix all hardcoded colors.**

---

## 10. Typography Audit

### Current Scale (typography.ts)
```
title: 20px / 26 line-height / 600 weight
h2: 18px / 24 line-height / 600 weight
body: 16px / 22 line-height / 400 weight
sub: 14px / 20 line-height / 400 weight
cap: 12px / 16 line-height / 400 weight
```

### Spec Requires
```
Display: 32pt / 40pt
Title 1: 28pt / 36pt
Title 2: 22pt / 28pt
Title 3: 18pt / 24pt
Headline: 16pt / 22pt (semibold)
Body: 16pt / 24pt
Body Small: 14pt / 20pt
Caption: 12pt / 16pt
Overline: 11pt / 14pt (uppercase)
```

### Screen Typography Usage

| Screen | Uses Token System | Uses Hardcoded |
|--------|-------------------|----------------|
| ProfileScreen | ✅ `<Text variant="title">` | No |
| DriversScreen | No | ✅ fontSize: 32, 16, 14 |
| ExploreScreen | No | ✅ fontSize: 32, 14, 12 |
| RouteEstimateScreen | No | ✅ fontSize: 24, 16, 14, 48 |
| LoginScreen | No | ✅ fontSize: 24, 16, 14 |

---

## 11. Component Audit

### Design System Components Available

| Component | Used Consistently |
|-----------|-------------------|
| Button | ⚠️ Few places |
| Input | ⚠️ Few places |
| Card | ⚠️ Few places |
| ListItem | ✅ ProfileScreen |
| Divider | ✅ ProfileScreen |
| Text (primitive) | ✅ ProfileScreen |
| Box (primitive) | ✅ ProfileScreen |
| Skeleton | ✅ ExploreScreen |
| Toast | ✅ App layout |

### Missing Components (per spec)

| Component | Spec Section | Status |
|-----------|--------------|--------|
| Offer Card | 9.3 / 14.6 | ❌ Not implemented |
| Price Label Badge | 9.4 | ❌ Not implemented |
| Rora Pro Badge | 9.4 | ❌ Not implemented |
| Collapsing Header | 9.7 | ❌ Not implemented |
| Filter Chips (spec style) | 9.5 | ⚠️ Exists but doesn't match spec |

---

## 12. Screen Template Audit

### Spec Templates vs Implementation

| Template | Spec Section | Status |
|----------|--------------|--------|
| Map + Bottom Sheet | 10.1 | ✅ Exists, ⚠️ no dim on expand |
| List Screen | 10.2 | ⚠️ No collapsing header |
| Detail Screen | 10.3 | ⚠️ Inconsistent |
| Full Screen Search | 10.4 | ✅ Within Explore |
| Auth Screen | 10.5 | ❌ Doesn't match spec |
| Settings Screen | 10.6 | ⚠️ Close |

### Template Gaps

1. **No reusable template components** - Each screen reimplements structure
2. **No collapsing large title** - Spec requires, not implemented
3. **No map dimming** - Spec requires dim when sheet expands
4. **Inconsistent safe area handling**

---

## 13. Navigation Audit

### Tab Structure

| Spec | Current | Gap |
|------|---------|-----|
| 5 tabs: Home, Drivers, Explore, Activity, Profile | 4 tabs: Home, Explore, Drivers, Profile | Missing: Activity |

### Tab Bar Behavior

| Requirement | Status |
|-------------|--------|
| Hidden during ride flow | ❌ Not implemented |
| 49pt + safe area height | ⚠️ Uses getTabBarHeight() |

---

## 14. State Handling Audit

### Empty States

| Screen | Has Empty State | Matches Spec |
|--------|-----------------|--------------|
| DriversScreen | ✅ "No drivers found" | ❌ No illustration |
| ExploreScreen | ❌ No | ❌ |

### Loading States

| Screen | Has Loading State | Uses Skeleton |
|--------|-------------------|---------------|
| ExploreScreen | ✅ Yes | ✅ Yes |
| DriversScreen | ❌ No | ❌ |
| RouteEstimateScreen | ✅ ActivityIndicator | ❌ Should be Skeleton |
| LoginScreen | ✅ ActivityIndicator | ❌ Should be Skeleton |

### Error States

| Screen | Uses Toast | Current Approach |
|--------|-----------|------------------|
| RouteEstimateScreen | ❌ | Alert.alert |
| LoginScreen | ❌ | Inline text |

---

## 15. Priority Remediation Plan

### P0 - Critical (Before Launch)

1. **Unify color system**
   - Update `colors.ts` to spec values (teal #14B8A6)
   - Replace all `#007AFF` with `colors.primary`
   - Replace all hardcoded colors

2. **Implement missing states**
   - Add skeleton loading to all data-fetching screens
   - Add empty states with illustrations
   - Replace Alert.alert with Toast

3. **Fix ride flow screens**
   - RouteEstimateScreen: Use design tokens
   - LoginScreen: Match auth template

### P1 - Important (First Sprint)

4. **Create screen templates**
   - MapSheetTemplate (map + bottom sheet with dim)
   - ListScreenTemplate (collapsing header)
   - DetailScreenTemplate (hero + content + fixed CTA)

5. **Implement missing components**
   - OfferCard per spec
   - PriceLabel badges (Good deal, Pricier)
   - ProBadge
   - CollapsingHeader

6. **Fix navigation**
   - Add Activity tab
   - Implement tab bar hide during ride flow

### P2 - Important (Second Sprint)

7. **Implement subscription UI**
   - Free tier limits
   - Locked content blur
   - Upgrade prompts

8. **Align all typography**
   - Expand typography tokens
   - Migrate all screens

---

## 16. File-by-File Changes Needed

### High Priority

| File | Changes |
|------|---------|
| `src/ui/tokens/colors.ts` | Update primary to #14B8A6, align all values |
| `src/features/ride/screens/RouteEstimateScreen.tsx` | Full redesign to spec |
| `src/features/auth/screens/LoginScreen.tsx` | Redesign to auth template |
| `app/(tabs)/drivers.tsx` | Add collapsing header, skeleton, tokens |
| `app/(tabs)/explore/index.tsx` | Add collapsing header, use tokens |

### New Files Needed

| File | Purpose |
|------|---------|
| `src/ui/templates/MapSheetTemplate.tsx` | Reusable map + sheet layout |
| `src/ui/templates/ListScreenTemplate.tsx` | Reusable list layout |
| `src/ui/components/OfferCard.tsx` | Offer card per spec |
| `src/ui/components/PriceLabel.tsx` | Price label badges |
| `app/(tabs)/activity.tsx` | Activity/history tab |

---

## Appendix: Current vs Spec Color Tokens

```typescript
// CURRENT (colors.ts)
primary: "#00BE3C",
bg: "#FFFFFF",
surface: "#F9F9F9",
text: "#262626",
textMuted: "#5C5F62",
border: "#E3E6E3",

// SPEC REQUIRES
primary: "#14B8A6",  // teal-500
background: "#FFFFFF",
surface: "#F9FAFB",  // gray-50
text: "#111827",     // gray-900
textMuted: "#6B7280", // gray-500
border: "#E5E7EB",   // gray-200
```

---

*End of Design Spec Compliance Audit*
