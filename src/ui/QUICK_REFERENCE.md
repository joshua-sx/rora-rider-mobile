# Quick Reference Card

One-page cheatsheet for the Rora UI Design System.

## Import

```tsx
import {
  // Tokens
  colors, space, radius, type, shadow,
  // Primitives
  Box, Text, Pressable,
  // Components
  Button, Input, SearchInput, Card, ListItem, Avatar, Badge, Divider,
  // Feedback
  Skeleton, EmptyState, ErrorState, Toast, Sheet,
} from '@/src/ui';
```

## Design Tokens

### Colors
```tsx
colors.bg          // #FFFFFF - Background
colors.surface     // #F9F9F9 - Cards, inputs
colors.text        // #262626 - Primary text
colors.textMuted   // #5C5F62 - Secondary text
colors.border      // #E3E6E3 - Dividers, borders
colors.primary     // #00BE3C - Brand color
colors.danger      // #D14343 - Errors
colors.warning     // #E9A63A - Warnings
colors.success     // #00BE3C - Success
colors.overlay     // rgba(0,0,0,0.4) - Modals
```

### Spacing (8px grid)
```tsx
space[0]  // 0px
space[1]  // 4px   - Micro
space[2]  // 8px   - Small
space[3]  // 12px  - Compact
space[4]  // 16px  - Default (use most often)
space[5]  // 20px  - Medium
space[6]  // 24px  - Section
space[7]  // 32px  - Screen
space[8]  // 40px  - Large
```

### Typography
```tsx
type.title  // 20px / 26px - Headings
type.body   // 16px / 22px - Body text
type.sub    // 14px / 20px - Secondary text
type.cap    // 12px / 16px - Captions
```

### Radius
```tsx
radius.sm   // 8px   - Small buttons, inputs
radius.md   // 12px  - Buttons, cards
radius.lg   // 16px  - Sheets, modals
radius.pill // 999px - Pill-shaped
```

### Shadow
```tsx
shadow.sm  // Subtle elevation
shadow.md  // Standard elevation
shadow.lg  // Prominent elevation
```

## Components

### Text
```tsx
<Text variant="title">Heading</Text>
<Text variant="body">Body text</Text>
<Text variant="sub" muted>Secondary</Text>
<Text variant="cap">Caption</Text>
```

### Button
```tsx
<Button label="Primary" variant="primary" onPress={handlePress} />
<Button label="Secondary" variant="secondary" onPress={handlePress} />
<Button label="Tertiary" variant="tertiary" onPress={handlePress} />
<Button label="Delete" variant="danger" onPress={handlePress} />

// Props: loading, disabled, fullWidth (default true)
```

### Input
```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  keyboardType="email-address"
/>
```

### SearchInput
```tsx
<SearchInput
  placeholder="Search"
  value={query}
  onChangeText={setQuery}
  icon={<Icon />}
/>
```

### Card
```tsx
<Card>
  <Text variant="title">Title</Text>
  {content}
</Card>
```

### ListItem
```tsx
<ListItem
  title="Title"
  subtitle="Subtitle"
  leading={<Avatar />}
  trailing={<ChevronRight />}
  onPress={handlePress}
/>
```

### Avatar
```tsx
<Avatar
  source={{ uri: url }}
  initials="JD"
  size="sm"  // sm | md | lg
/>
```

### Badge
```tsx
<Badge label="Active" variant="success" />
// Variants: default | success | danger | warning
```

### Divider
```tsx
<Divider />
<Divider style={{ marginVertical: space[3] }} />
```

### Skeleton (Loading)
```tsx
<Skeleton width="100%" height={60} borderRadius={radius.md} />
```

### EmptyState
```tsx
<EmptyState
  message="No results found"
  actionLabel="Retry"
  onAction={handleRetry}
  icon={<Icon />}
/>
```

### ErrorState
```tsx
<ErrorState
  title="Connection Failed"
  message="Check your connection and try again"
  actionLabel="Retry"
  onAction={handleRetry}
/>
```

### Toast
```tsx
<Toast
  message="Saved successfully"
  duration={3000}
  onDismiss={handleDismiss}
/>
```

### Sheet
```tsx
const sheetRef = useRef<BottomSheet>(null);

<Sheet
  ref={sheetRef}
  snapPoints={["25%", "50%"]}
  index={1}
  enablePanDownToClose
>
  {content}
</Sheet>
```

## Layout Patterns

### Screen Padding
```tsx
<ScrollView contentContainerStyle={{ padding: space[4], gap: space[4] }}>
```

### Two-Column Layout
```tsx
<Box style={{ flexDirection: 'row', gap: space[2] }}>
  <Box style={{ flex: 1 }}>
    <Button label="Cancel" variant="secondary" />
  </Box>
  <Box style={{ flex: 1 }}>
    <Button label="Save" variant="primary" />
  </Box>
</Box>
```

### Info Row
```tsx
<Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text variant="body" muted>Label</Text>
  <Text variant="body">Value</Text>
</Box>
```

### Section with Gap
```tsx
<Box style={{ gap: space[4] }}>
  <Text variant="title">Section Title</Text>
  <Input label="Field" />
</Box>
```

## Design Rules (DO / DON'T)

### Spacing
- ✅ DO use `space[*]` scale
- ❌ DON'T hardcode px values

### Colors
- ✅ DO use `colors.*` tokens
- ❌ DON'T hardcode hex values

### Typography
- ✅ DO use `<Text variant="...">`
- ❌ DON'T set fontSize/lineHeight manually

### Buttons
- ✅ DO use one primary button per screen
- ❌ DON'T use multiple primary buttons

### Loading
- ✅ DO use Skeleton components
- ❌ DON'T use bare ActivityIndicator

### Touch Targets
- ✅ DO ensure 44px minimum (52px in system)
- ❌ DON'T create tiny tap areas

### States
- ✅ DO handle loading/empty/error explicitly
- ❌ DON'T show raw undefined/null content

## Accessibility

```tsx
// Always provide labels
<Pressable
  accessibilityLabel="Close dialog"
  accessibilityRole="button"
  accessibilityHint="Dismisses the current dialog"
>
  <Icon name="close" />
</Pressable>

// Use semantic components
<Button label="Submit" />  // Already has accessibilityRole="button"
```

## Common Mistakes

### ❌ Wrong
```tsx
<View style={{ backgroundColor: '#FFFFFF', padding: 16 }}>
  <Text style={{ fontSize: 20, fontWeight: '600' }}>Title</Text>
</View>
```

### ✅ Right
```tsx
<Box style={{ backgroundColor: colors.bg, padding: space[4] }}>
  <Text variant="title">Title</Text>
</Box>
```

---

### ❌ Wrong
```tsx
<Pressable style={{ height: 48 }}>
  <Text>Button</Text>
</Pressable>
```

### ✅ Right
```tsx
<Button label="Button" onPress={handlePress} />
```

---

### ❌ Wrong
```tsx
{isLoading ? <ActivityIndicator /> : <Content />}
```

### ✅ Right
```tsx
{isLoading ? <Skeleton width="100%" height={120} /> : <Content />}
```

## File Locations

```
/src/ui/
├── tokens/
│   ├── colors.ts      # Color palette
│   ├── spacing.ts     # Spacing scale
│   ├── radius.ts      # Border radius
│   ├── typography.ts  # Type scale
│   ├── shadow.ts      # Shadow styles
│   └── theme.ts       # Exports all tokens
├── primitives/
│   ├── Box.tsx        # View wrapper
│   ├── Text.tsx       # Text with variants
│   └── Pressable.tsx  # Pressable with feedback
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── SearchInput.tsx
│   ├── Card.tsx
│   ├── ListItem.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Divider.tsx
│   ├── Skeleton.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── Toast.tsx
│   └── Sheet.tsx
├── index.ts           # Public exports
├── README.md          # Full documentation
├── EXAMPLES.md        # Real-world examples
├── MIGRATION.md       # Migration guide
└── QUICK_REFERENCE.md # This file
```

## Next Steps

1. Import what you need: `import { Button, space, colors } from '@/src/ui'`
2. Use tokens instead of hardcoded values
3. Build with primitives (Box, Text, Pressable)
4. Leverage components for common patterns
5. Handle all states (loading, empty, error)

**Questions?** Check [README.md](./README.md) or [EXAMPLES.md](./EXAMPLES.md)
