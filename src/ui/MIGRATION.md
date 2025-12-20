# Migration Guide

How to gradually migrate your existing Rora components to the new design system.

## Strategy

**Coexistence First, Migration Second**

The new design system lives in `/src/ui/` and can coexist with your existing components in `/components/`. Migrate screens gradually, one at a time.

## Phase 1: Start Using New Components

Begin using the new design system for **new screens and features**.

### Import Changes

**Before:**
```tsx
import { Colors, Spacing, BorderRadius } from '@/constants/design-tokens';
import { SearchInput } from '@/components/ui/search-input';
```

**After:**
```tsx
import { colors, space, radius, SearchInput } from '@/src/ui';
```

### Token Mapping

Your existing tokens map cleanly to the new system:

| Old Token | New Token | Value |
|-----------|-----------|-------|
| `Colors.primary` | `colors.primary` | #00BE3C |
| `Colors.textSlate` | `colors.text` | #262626 |
| `Colors.neutralStone` | `colors.textMuted` | #5C5F62 |
| `Colors.canvasMist` | `colors.surface` | #F9F9F9 |
| `Colors.cardWhite` | `colors.bg` | #FFFFFF |
| `Spacing.xs` | `space[1]` | 4px |
| `Spacing.sm` | `space[2]` | 8px |
| `Spacing.lg` | `space[4]` | 16px |
| `Spacing.xxl` | `space[6]` | 24px |
| `BorderRadius.md` | `radius.sm` | 8px |
| `BorderRadius.button` | `radius.md` | 12px |
| `BorderRadius.card` | `radius.lg` | 16px |

## Phase 2: Migrate Existing Screens

Pick one screen at a time and refactor it to use the new system.

### Example: Drivers List Screen

**Before ([app/(tabs)/drivers.tsx](../../../app/(tabs)/drivers.tsx)):**
```tsx
import { Colors, Spacing } from '@/constants/design-tokens';
import { ThemedText } from '@/components/themed-text';
import { DriverCard } from '@/components/driver-card';

export default function DriversScreen() {
  return (
    <View style={{ padding: Spacing.lg, backgroundColor: Colors.canvasMist }}>
      <ThemedText style={{ fontSize: 20, fontWeight: '600' }}>
        Available Drivers
      </ThemedText>
      {/* ... */}
    </View>
  );
}
```

**After:**
```tsx
import { Box, Text, space, colors } from '@/src/ui';
import { DriverCard } from '@/components/driver-card';  // Keep existing for now

export default function DriversScreen() {
  return (
    <Box style={{ padding: space[4], backgroundColor: colors.surface }}>
      <Text variant="title">Available Drivers</Text>
      {/* ... */}
    </Box>
  );
}
```

### Component Migration Priority

Migrate in this order for maximum impact:

1. **Design tokens** (colors, spacing) - Easy wins, huge consistency gains
2. **Typography** (ThemedText → Text) - Simplifies code significantly
3. **Buttons** (Custom buttons → Button) - Ensures consistent interaction
4. **Inputs** (Custom inputs → Input) - Better validation and error handling
5. **Layout** (Cards, ListItems) - Structural consistency
6. **Feedback** (Loading, Empty, Error states) - Better UX

## Phase 3: Refactor Complex Components

Some components will need more work. Here's how to approach them:

### Example: DriverCard Migration

Your existing [DriverCard](../../../components/driver-card.tsx) is already well-structured. Here's how to make it use the new system:

**Current implementation uses:**
- `BorderRadius`, `Spacing` from design-tokens
- `ThemedText` for typography
- Manual style calculations

**Migration steps:**

1. **Import new tokens:**
```tsx
import { colors, space, radius, type } from '@/src/ui/tokens/theme';
```

2. **Replace ThemedText with Text:**
```tsx
// Before
<ThemedText style={styles.name}>{driver.name}</ThemedText>

// After
<Text variant="body" style={{ fontWeight: '600' }}>{driver.name}</Text>
```

3. **Use semantic tokens:**
```tsx
// Before
const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
  },
});

// After
const styles = StyleSheet.create({
  card: {
    padding: space[4],
    borderRadius: radius.lg,
  },
});
```

### Example: SearchInput Migration

Your existing [SearchInput](../../../components/ui/search-input.tsx) can be replaced wholesale:

**Before:**
```tsx
import { SearchInput } from '@/components/ui/search-input';

<SearchInput
  placeholder="Search destination"
  value={query}
  onChangeText={setQuery}
/>
```

**After:**
```tsx
import { SearchInput } from '@/src/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/ui';

<SearchInput
  placeholder="Search destination"
  value={query}
  onChangeText={setQuery}
  icon={<Ionicons name="search" size={20} color={colors.textMuted} />}
/>
```

## Phase 4: Clean Up

Once a screen is fully migrated:

1. Remove unused imports from old design system
2. Delete unused component files from `/components/ui/`
3. Update tests if applicable

## Common Migration Patterns

### Pattern 1: Themed Colors

**Before:**
```tsx
const textColor = useThemeColor(
  { light: '#262626', dark: '#E5E7EA' },
  'text'
);
```

**After:**
```tsx
import { colors } from '@/src/ui';
// Use colors.text directly - dark mode support coming in Phase 5
```

### Pattern 2: Typography

**Before:**
```tsx
<ThemedText style={{ fontSize: 16, fontWeight: '400', lineHeight: 22 }}>
  Body text
</ThemedText>
```

**After:**
```tsx
<Text variant="body">Body text</Text>
```

### Pattern 3: Spacing

**Before:**
```tsx
<View style={{ gap: 12, marginBottom: 16, padding: 24 }}>
```

**After:**
```tsx
<Box style={{ gap: space[3], marginBottom: space[4], padding: space[6] }}>
```

### Pattern 4: Cards

**Before:**
```tsx
<View style={{
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E3E6E3',
  padding: 16,
}}>
  {content}
</View>
```

**After:**
```tsx
<Card>
  {content}
</Card>
```

### Pattern 5: Buttons

**Before:**
```tsx
<Pressable
  style={{
    backgroundColor: '#00BE3C',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }}
  onPress={handlePress}
>
  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
    Continue
  </Text>
</Pressable>
```

**After:**
```tsx
<Button
  label="Continue"
  onPress={handlePress}
  variant="primary"
/>
```

## Component Equivalents

| Old Component | New Component | Location |
|---------------|---------------|----------|
| `<ThemedText>` | `<Text>` | `@/src/ui` |
| `<ThemedView>` | `<Box>` | `@/src/ui` |
| Custom buttons | `<Button>` | `@/src/ui` |
| Custom inputs | `<Input>` | `@/src/ui` |
| `<SearchInput>` (old) | `<SearchInput>` (new) | `@/src/ui` |
| Custom cards | `<Card>` | `@/src/ui` |
| Custom list items | `<ListItem>` | `@/src/ui` |
| Spinners | `<Skeleton>` | `@/src/ui` |
| N/A | `<EmptyState>` | `@/src/ui` |
| N/A | `<ErrorState>` | `@/src/ui` |

## Validation Checklist

After migrating a screen, verify:

- [ ] All hardcoded colors replaced with `colors.*`
- [ ] All hardcoded spacing replaced with `space[*]`
- [ ] Typography uses `<Text variant="...">` or primitives
- [ ] Buttons use `<Button variant="...">`
- [ ] Loading states use `<Skeleton>` (not spinners)
- [ ] Empty states use `<EmptyState>`
- [ ] Error states use `<ErrorState>`
- [ ] Touch targets are 44px minimum (52px in our system)
- [ ] Accessibility labels present on interactive elements
- [ ] Component imports from `@/src/ui`

## Need Help?

Refer to:
- [README.md](./README.md) - Component API reference
- [EXAMPLES.md](./EXAMPLES.md) - Real-world usage patterns
- Existing implementation in `/src/ui/components/`

## Benefits You'll See

After migration:

✅ **Consistency** - All screens follow the same patterns
✅ **Less code** - Primitives and components reduce boilerplate
✅ **Better UX** - Proper states (loading, empty, error) everywhere
✅ **Easier maintenance** - Change tokens, not individual styles
✅ **Faster development** - Reusable components speed up new features
✅ **Accessibility** - Built-in support for screen readers and contrast

## Timeline Suggestion

- **Week 1**: Use new system for all new screens
- **Week 2-3**: Migrate 2-3 existing screens
- **Week 4**: Refactor complex components (DriverCard, etc.)
- **Week 5**: Clean up and remove old components

Start today. Pick one new screen and use the design system. You'll immediately see the benefits.
