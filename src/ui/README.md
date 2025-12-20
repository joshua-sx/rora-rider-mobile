# Rora UI Design System

A production-ready, Dieter Rams-inspired component library for React Native and Expo.

## Philosophy

Every design decision follows the Dieter Rams principles of good design:

1. **Useful** – Every component solves a real problem
2. **Understandable** – No explanations required
3. **Unobtrusive** – UI supports content, never competes with it
4. **Honest** – Buttons look clickable. Cards look tappable
5. **Long-lasting** – No trend-driven gimmicks
6. **Thorough** – Spacing, states, motion are intentional
7. **Minimal** – As little design as possible. Then less

## Structure

```
src/ui/
├── tokens/          # Design tokens (colors, spacing, typography, etc.)
├── primitives/      # Building blocks (Box, Text, Pressable)
├── components/      # UI components (Button, Input, Card, etc.)
└── index.ts         # Public exports
```

## Design Tokens

### Colors
- Neutrals do the heavy lifting
- One strong accent color (Rora Green: #00BE3C)
- Functional colors used sparingly

```ts
import { colors } from '@/src/ui';

colors.bg          // #FFFFFF
colors.text        // #262626
colors.primary     // #00BE3C
colors.danger      // #D14343
```

### Spacing
8-point grid. No exceptions.

```ts
import { space } from '@/src/ui';

space[0]  // 0px
space[1]  // 4px
space[2]  // 8px
space[4]  // 16px (default)
space[6]  // 24px (sections)
```

### Typography
One font family. Two weights. Three sizes.

```ts
import { type } from '@/src/ui';

type.title  // 20px / 26px line-height
type.body   // 16px / 22px line-height
type.sub    // 14px / 20px line-height
type.cap    // 12px / 16px line-height
```

### Border Radius

```ts
import { radius } from '@/src/ui';

radius.sm   // 8px  - inputs, small buttons
radius.md   // 12px - buttons, cards
radius.lg   // 16px - sheets, modals
radius.pill // 999px - pill-shaped
```

## Components

### Primitives

#### Box
The boring building block. Use `View` directly.

```tsx
import { Box } from '@/src/ui';

<Box style={{ padding: space[4] }}>
  {children}
</Box>
```

#### Text
Typography primitive with variants.

```tsx
import { Text } from '@/src/ui';

<Text variant="title">Heading</Text>
<Text variant="body" muted>Secondary text</Text>
```

#### Pressable
Interaction primitive with standard press feedback.

```tsx
import { Pressable } from '@/src/ui';

<Pressable onPress={handlePress}>
  {children}
</Pressable>
```

### UI Components

#### Button
One per screen. If everything is primary, nothing is.

```tsx
import { Button } from '@/src/ui';

<Button
  label="Continue"
  onPress={handlePress}
  variant="primary"  // primary | secondary | tertiary | danger
  loading={isLoading}
  disabled={!isValid}
  fullWidth
/>
```

#### Input
Proper states: default, focused, filled, error, disabled.

```tsx
import { Input } from '@/src/ui';

<Input
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  keyboardType="email-address"
/>
```

#### SearchInput
Full width search with icon support.

```tsx
import { SearchInput } from '@/src/ui';
import { Ionicons } from '@expo/vector-icons';

<SearchInput
  placeholder="Search destinations"
  value={query}
  onChangeText={setQuery}
  icon={<Ionicons name="search" size={20} color="#5C5F62" />}
/>
```

#### Card
Groups related info. One primary action. No nested cards.

```tsx
import { Card } from '@/src/ui';

<Card>
  {content}
</Card>
```

#### ListItem
Entire row tappable. Structure: Leading | Content | Trailing.

```tsx
import { ListItem, Avatar } from '@/src/ui';

<ListItem
  title="John Doe"
  subtitle="4.8 stars • 156 trips"
  onPress={handlePress}
  leading={<Avatar initials="JD" size="md" />}
  trailing={<ChevronRight />}
/>
```

#### Avatar
Circle only. Initials fallback. Never stretch images.

```tsx
import { Avatar } from '@/src/ui';

<Avatar
  source={{ uri: profileUrl }}
  initials="JD"
  size="lg"  // sm | md | lg
/>
```

#### Badge
Small status indicator.

```tsx
import { Badge } from '@/src/ui';

<Badge
  label="On Duty"
  variant="success"  // default | success | danger | warning
/>
```

#### Divider
Simple horizontal line.

```tsx
import { Divider } from '@/src/ui';

<Divider />
```

### Feedback Components

#### Skeleton
Loading placeholder. Prefer skeletons over spinners.

```tsx
import { Skeleton } from '@/src/ui';

<Skeleton width="100%" height={60} borderRadius={12} />
```

#### EmptyState
Clear message + single action. No jokes. Be helpful.

```tsx
import { EmptyState } from '@/src/ui';

<EmptyState
  message="No drivers available in your area"
  actionLabel="Refresh"
  onAction={handleRefresh}
  icon={<Ionicons name="car-outline" size={48} />}
/>
```

#### ErrorState
Explain what happened, what to do next. Never blame the user.

```tsx
import { ErrorState } from '@/src/ui';

<ErrorState
  title="Connection Failed"
  message="Check your internet connection and try again."
  actionLabel="Retry"
  onAction={handleRetry}
/>
```

#### Toast
Temporary feedback. One line when possible. Auto dismiss.

```tsx
import { Toast } from '@/src/ui';

<Toast
  message="Booking confirmed"
  duration={3000}
  onDismiss={handleDismiss}
/>
```

#### Sheet
Bottom sheet wrapper. Bottom sheets > modals for mobile. Period.

```tsx
import { Sheet } from '@/src/ui';
import { useRef } from 'react';

const sheetRef = useRef<BottomSheet>(null);

<Sheet
  ref={sheetRef}
  snapPoints={["25%", "50%", "90%"]}
  index={1}
  enablePanDownToClose
>
  {content}
</Sheet>
```

## Design Rules

### Spacing
- Use the 8-point grid system
- If spacing feels "off", you skipped the system

### Colors
- No gradients unless data visualization
- No more than one accent color per screen
- Disabled is opacity, not a new color

### Typography
- No center alignment for body text
- Line height > font size. Always.
- Never truncate critical text

### Buttons
- One primary button per screen
- Primary = High contrast, full width on mobile
- Secondary = Outline or muted fill
- Tertiary = Text-only, never for destructive actions

### Motion
- 150-250ms transitions
- Ease out
- Never animate layout shifts unnecessarily
- If motion draws attention to itself, it's wrong

### Accessibility
- Minimum 44px tap targets (52px in our system)
- Color contrast AA+
- Screen reader labels on everything
- No color-only meaning

## Usage Example

```tsx
import React from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  Button,
  Input,
  Card,
  ListItem,
  Avatar,
  space,
} from '@/src/ui';

export function BookingScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: space[4], gap: space[4] }}>
      <Card>
        <Text variant="title">Select Pickup</Text>
        <Box style={{ marginTop: space[4] }}>
          <Input
            label="Location"
            placeholder="Enter address"
            value={location}
            onChangeText={setLocation}
          />
        </Box>
      </Card>

      <Card>
        <Text variant="title">Available Drivers</Text>
        <Box style={{ marginTop: space[3] }}>
          <ListItem
            title="John Doe"
            subtitle="4.8 stars • 156 trips"
            leading={<Avatar initials="JD" />}
            onPress={selectDriver}
          />
        </Box>
      </Card>

      <Button
        label="Confirm Booking"
        onPress={handleConfirm}
        loading={isLoading}
      />
    </ScrollView>
  );
}
```

## Migration from Existing Components

Your existing components in `/components/ui/` can coexist with this system. Gradually migrate screens to use the new system for consistency.

### Example Migration

Before:
```tsx
import { SearchInput } from '@/components/ui/search-input';
```

After:
```tsx
import { SearchInput } from '@/src/ui';
```

## Best Practices

1. **Use design tokens** – Never hardcode values
2. **Favor primitives** – Build with Box, Text, Pressable first
3. **Keep it simple** – Avoid over-engineering
4. **One source of truth** – Use these components, don't fork them
5. **Accessibility first** – Always provide labels and proper contrast

## Anti-Patterns

❌ Don't create custom spacing values
✅ Use the `space` scale

❌ Don't add multiple primary buttons per screen
✅ One primary action, rest are secondary/tertiary

❌ Don't use spinners when skeletons work better
✅ Match layout of final content

❌ Don't center-align body text
✅ Left-align for readability

❌ Don't use color as the only indicator
✅ Combine with icons or text

## References

- Dieter Rams' 10 Principles: https://www.vitsoe.com/us/about/good-design
- iOS Human Interface Guidelines
- Material Design (selectively)
- Your existing [design-tokens.ts](../../constants/design-tokens.ts)
