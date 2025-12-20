# Rora UI - Practical Examples

Real-world examples showing how to build production screens with the design system.

## Example 1: Driver List Screen

A complete screen showing drivers with search, filtering, and proper states.

```tsx
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Box,
  Text,
  SearchInput,
  Card,
  ListItem,
  Avatar,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
  space,
  colors,
} from '@/src/ui';

type Driver = {
  id: string;
  name: string;
  rating: number;
  trips: number;
  vehicleType: string;
  onDuty: boolean;
  avatarUrl?: string;
};

export function DriverListScreen() {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Loading state
  if (isLoading) {
    return (
      <Box style={{ padding: space[4], gap: space[4] }}>
        <Skeleton width="100%" height={52} />
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={120} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to Load Drivers"
        message="Check your internet connection and try again."
        actionLabel="Retry"
        onAction={() => {
          setError(null);
          // Retry logic here
        }}
      />
    );
  }

  // Empty state
  if (drivers.length === 0) {
    return (
      <EmptyState
        message="No drivers available in your area"
        actionLabel="Refresh"
        onAction={() => {
          // Refresh logic here
        }}
        icon={<Ionicons name="car-outline" size={48} color={colors.textMuted} />}
      />
    );
  }

  // Content state
  return (
    <ScrollView
      contentContainerStyle={{
        padding: space[4],
        gap: space[4],
      }}
    >
      <SearchInput
        placeholder="Search drivers"
        value={search}
        onChangeText={setSearch}
        icon={<Ionicons name="search" size={20} color={colors.textMuted} />}
      />

      {drivers.map((driver) => (
        <Card key={driver.id}>
          <ListItem
            title={driver.name}
            subtitle={`${driver.rating.toFixed(1)} stars • ${driver.trips} trips`}
            leading={
              <Avatar
                source={driver.avatarUrl ? { uri: driver.avatarUrl } : undefined}
                initials={driver.name.split(' ').map(n => n[0]).join('')}
                size="md"
              />
            }
            trailing={
              driver.onDuty ? (
                <Badge label="On Duty" variant="success" />
              ) : null
            }
            onPress={() => {
              // Navigate to driver details
            }}
          />
        </Card>
      ))}
    </ScrollView>
  );
}
```

## Example 2: Booking Form

A multi-step form with validation and proper error handling.

```tsx
import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Box,
  Text,
  Input,
  Button,
  Card,
  Divider,
  space,
} from '@/src/ui';

export function BookingFormScreen() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    let isValid = true;

    if (!pickup) {
      setPickupError('Pickup location is required');
      isValid = false;
    } else {
      setPickupError('');
    }

    if (!destination) {
      setDestinationError('Destination is required');
      isValid = false;
    } else {
      setDestinationError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Submit booking
      await bookRide({ pickup, destination });
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: space[4],
          gap: space[4],
        }}
      >
        <Card>
          <Text variant="title">Trip Details</Text>

          <Box style={{ marginTop: space[4], gap: space[4] }}>
            <Input
              label="Pickup Location"
              placeholder="Enter pickup address"
              value={pickup}
              onChangeText={setPickup}
              error={pickupError}
            />

            <Input
              label="Destination"
              placeholder="Where to?"
              value={destination}
              onChangeText={setDestination}
              error={destinationError}
            />
          </Box>
        </Card>

        <Card>
          <Text variant="title">Fare Estimate</Text>
          <Divider style={{ marginVertical: space[3] }} />

          <Box style={{ gap: space[2] }}>
            <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" muted>Base fare</Text>
              <Text variant="body">$5.00</Text>
            </Box>
            <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" muted>Distance</Text>
              <Text variant="body">$12.50</Text>
            </Box>
            <Divider style={{ marginVertical: space[2] }} />
            <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" style={{ fontWeight: '600' }}>Total</Text>
              <Text variant="title">$17.50</Text>
            </Box>
          </Box>
        </Card>

        <Button
          label="Confirm Booking"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!pickup || !destination}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

## Example 3: Bottom Sheet with Map Integration

The taxi flow pattern: map + bottom sheet.

```tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  Box,
  Text,
  Button,
  ListItem,
  Avatar,
  Badge,
  Sheet,
  space,
  colors,
} from '@/src/ui';

export function RideRequestScreen() {
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        // Map configuration
      />

      {/* Bottom sheet overlays the map */}
      <Sheet
        ref={sheetRef}
        snapPoints={['15%', '50%', '90%']}
        index={1}
      >
        <Box style={{ padding: space[4], gap: space[4] }}>
          {/* Collapsed state */}
          <Text variant="sub" muted style={{ textAlign: 'center' }}>
            Slide up for details
          </Text>

          {/* Expanded state - Driver info */}
          <Box style={{ gap: space[3] }}>
            <Text variant="title">Your Driver</Text>

            <ListItem
              title="John Doe"
              subtitle="4.8 stars • Toyota Camry"
              leading={<Avatar initials="JD" size="lg" />}
              trailing={<Badge label="On the way" variant="success" />}
            />
          </Box>

          {/* Trip details */}
          <Box style={{ gap: space[2] }}>
            <Text variant="sub" muted>Pickup</Text>
            <Text variant="body">123 Main Street</Text>

            <Text variant="sub" muted style={{ marginTop: space[2] }}>Destination</Text>
            <Text variant="body">456 Oak Avenue</Text>
          </Box>

          {/* CTA - Always visible */}
          <Button
            label="Cancel Ride"
            variant="danger"
            onPress={() => {
              // Handle cancellation
            }}
          />
        </Box>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## Example 4: Tab Navigation with Bottom Tabs

Proper navigation structure.

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="drivers"
        options={{
          title: 'Drivers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Example 5: Screen Header Pattern

Consistent header across screens.

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, space, colors } from '@/src/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, showBack = true, rightAction }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + space[2],
          paddingBottom: space[2],
        },
      ]}
    >
      {/* Left: Back or empty */}
      <View style={styles.left}>
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* Center: Title */}
      <Text variant="title" numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {/* Right: One action max */}
      <View style={styles.right}>
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## Common Patterns

### Pattern: Form Section
```tsx
<Card>
  <Text variant="title">Section Title</Text>
  <Box style={{ marginTop: space[4], gap: space[4] }}>
    <Input label="Field 1" />
    <Input label="Field 2" />
  </Box>
</Card>
```

### Pattern: Two-Column Layout
```tsx
<Box style={{ flexDirection: 'row', gap: space[2] }}>
  <Box style={{ flex: 1 }}>
    <Button label="Cancel" variant="secondary" />
  </Box>
  <Box style={{ flex: 1 }}>
    <Button label="Confirm" variant="primary" />
  </Box>
</Box>
```

### Pattern: Info Row
```tsx
<Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text variant="body" muted>Label</Text>
  <Text variant="body">Value</Text>
</Box>
```

### Pattern: Action Sheet Item
```tsx
<Pressable
  style={{
    paddingVertical: space[4],
    paddingHorizontal: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }}
  onPress={handleAction}
>
  <Text variant="body">Action Label</Text>
</Pressable>
```

## Tips

1. **Maintain consistent padding**: Use `space[4]` (16px) for screen padding
2. **Consistent gaps**: Use `space[4]` between major sections, `space[2]` for related items
3. **Full-width buttons**: Primary actions should be full width on mobile
4. **Loading states**: Always show skeletons that match final content layout
5. **Error boundaries**: Wrap major sections in error boundaries with ErrorState fallback
6. **Safe areas**: Always respect safe area insets for headers and tab bars
7. **Keyboard handling**: Use KeyboardAvoidingView for forms
8. **Accessibility**: Add accessibilityLabel to all interactive elements

## Migration Checklist

- [ ] Replace hardcoded colors with `colors.*`
- [ ] Replace hardcoded spacing with `space[*]`
- [ ] Replace hardcoded radius with `radius.*`
- [ ] Use `Button` component for all CTAs
- [ ] Use `Input` component for all text fields
- [ ] Use `Card` for grouped content
- [ ] Use `Skeleton` for loading states
- [ ] Use `EmptyState` / `ErrorState` for feedback
- [ ] Ensure 52px minimum touch targets
- [ ] Add proper accessibility labels
