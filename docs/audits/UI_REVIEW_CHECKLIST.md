# UI Changes PR Review Checklist

Use this checklist when reviewing any UI-related pull request. Check all items before approving.

---

## 1. Screen Structure
_Mandatory for new screens_

- [ ] Screen uses appropriate template (`ListScreenTemplate`, `DetailScreenTemplate`, or `Screen`)
- [ ] Safe area insets applied correctly (no hardcoded padding at top/bottom)
- [ ] Tab bar height accounted for in scrollable content padding
- [ ] ScrollView or FlatList includes `showsVerticalScrollIndicator={false}` if needed
- [ ] Content doesn't overflow beneath tab bar or notch areas

## 2. Layout Primitives
_No raw Views with custom styles_

- [ ] Uses `Box`, `Text`, `Pressable` from `src/ui/primitives` (not raw React Native)
- [ ] Spacing between elements uses `space` tokens from `tokens/spacing.ts`
- [ ] Components composed from primitives: Box, Text, Pressable, Card
- [ ] No inline styles for layout without token values

## 3. Tokens Only
_No hardcoded values_

- [ ] No hardcoded spacing values (use `space[0-9]` from `tokens/spacing.ts`)
- [ ] No hardcoded font sizes (use `Text` variant prop)
- [ ] No hardcoded border radius (use `radius.sm/md/lg/pill` from `tokens/radius.ts`)
- [ ] No hardcoded colors (use `colors.*` from `tokens/colors.ts`)
- [ ] No hardcoded line heights (inherit from typography variants)

**Token Reference:**
```typescript
// Spacing (8-point grid)
space[0] = 0, space[1] = 4, space[2] = 8, space[3] = 12,
space[4] = 16, space[5] = 20, space[6] = 24, space[7] = 32,
space[8] = 40, space[9] = 48

// Radius
radius.sm = 10, radius.md = 14, radius.lg = 18, radius.pill = 999
```

## 4. Content Stress Tests
_Handle edge cases gracefully_

- [ ] Long text (50+ chars) in titles wraps or truncates correctly
- [ ] Very long text in body content doesn't overflow container
- [ ] Accessibility fonts (large text size) tested and readable
- [ ] Missing/placeholder images don't break layout
- [ ] Loading states show skeleton or spinner, not empty space
- [ ] Empty states have clear message + CTA (use `EmptyState` component)
- [ ] Error states clearly indicate what went wrong

## 5. Text Truncation & Line Limits
_Prevent overflow_

- [ ] Titles use `numberOfLines={1}` or `numberOfLines={2}` max
- [ ] Subtitles use `numberOfLines={2}` max
- [ ] Metadata/timestamps use `numberOfLines={1}` only
- [ ] Use `TruncatedText` component for semantic truncation
- [ ] Long addresses use middle ellipsis (`TruncatedText truncation="address"`)
- [ ] No text allowed to overflow container boundaries

**TruncatedText Variants:**
```typescript
truncation="title"       // 1 line, tail ellipsis
truncation="address"     // 1 line, middle ellipsis
truncation="subtitle"    // 2 lines, tail ellipsis
truncation="description" // 3 lines, tail ellipsis
truncation="body"        // 4 lines, tail ellipsis
```

## 6. Data Formatting
_Via helper functions, not inline_

- [ ] Currency values use `formatCurrency()` from `utils/format.ts`
- [ ] Distances use `formatDistance()` from `utils/format.ts`
- [ ] Durations use `formatDuration()` from `utils/format.ts`
- [ ] Dates formatted via helper (not raw ISO strings)
- [ ] No raw `.toFixed()` calls in JSX

## 7. Row Flexing & Text Shrinking
_Prevent overflow in rows_

- [ ] Rows with text + trailing content include `minWidth: 0` on the flex container
- [ ] Text in rows doesn't overflow beyond trailing badge/price/icon
- [ ] Icon + text rows properly sized with `alignItems: 'center'`
- [ ] Trailing elements (prices, badges) use `flexShrink: 0`

**Correct Pattern:**
```typescript
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0, // ← Critical for text shrinking
  },
  trailingContent: {
    flexShrink: 0,
    marginLeft: space[3],
  },
});
```

## 8. Positioning Strategy
_Flexbox first_

- [ ] No `position: 'absolute'` outside of overlays/modals/FABs
- [ ] Modals/overlays properly tested on various screen sizes
- [ ] FAB buttons positioned with safe area insets
- [ ] Positioned elements don't hide important content

## 9. Component Quality

- [ ] Component has clear, typed props interface (no `any`)
- [ ] Component works in isolation (no external state assumptions)
- [ ] Styles scoped via `StyleSheet.create`
- [ ] Component under 300 lines (split if larger)
- [ ] No commented-out code or console.log statements

## 10. Accessibility

- [ ] Touch targets >= 44x44 points (iOS standard)
- [ ] Icon buttons have `accessibilityLabel`
- [ ] Color contrast passes WCAG AA (4.5:1 for text)
- [ ] Text doesn't rely solely on color to convey meaning

## 11. Testing & Screenshots

- [ ] UI changes verified on both iOS and Android simulators
- [ ] Simulator screenshots included in PR for new screens/components
- [ ] Layout tested at multiple text sizes (default, large, extra large)
- [ ] Layout tested on different screen sizes (SE, Pro, Max)

## 12. Performance

- [ ] Lists use `FlatList` with `keyExtractor` (not ScrollView of many items)
- [ ] Images use `AppImage` component (not raw `Image`)
- [ ] `StyleSheet.create` used (not inline style objects)
- [ ] No unnecessary re-renders (verify with React DevTools if complex)

## 13. Type Safety

- [ ] All props properly typed
- [ ] `npx tsc --noEmit` passes without errors
- [ ] Generated database types used where applicable

---

## Quick Reference: Best-in-Class Examples

| Pattern | Reference File |
|---------|----------------|
| Text truncation | `src/ui/components/TruncatedText.tsx` |
| Complex card layout | `src/ui/components/TripCard.tsx` |
| Safe area handling | `src/features/home/components/destination-bottom-sheet.tsx` |
| Screen wrapper | `src/ui/components/Screen.tsx` |
| Button variants | `src/ui/components/Button.tsx` |
| Form inputs | `src/ui/components/Input.tsx` |

---

## Anti-Patterns to Reject

```typescript
// ❌ Hardcoded spacing
padding: 16

// ✅ Token spacing
padding: space[4]

// ❌ Hardcoded color
color: '#262626'

// ✅ Token color
color: colors.text

// ❌ Raw View/Text from react-native
import { View, Text } from 'react-native'

// ✅ Primitives from ui
import { Box, Text } from '@/src/ui/primitives'

// ❌ Inline formatting
<Text>${price.toFixed(2)}</Text>

// ✅ Format helper
<Text>{formatCurrency(price)}</Text>

// ❌ Text without truncation protection
<Text style={{ flex: 1 }}>{title}</Text>

// ✅ Protected text
<Text style={{ flex: 1 }} numberOfLines={1}>{title}</Text>

// ❌ Row without minWidth: 0
<View style={{ flex: 1 }}>
  <Text>{longText}</Text>
</View>

// ✅ Row with minWidth: 0
<View style={{ flex: 1, minWidth: 0 }}>
  <Text numberOfLines={1}>{longText}</Text>
</View>
```
