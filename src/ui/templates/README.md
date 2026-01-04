# Screen Templates

Reusable screen layout templates that implement consistent UX patterns across the Rora Rider app.

## Overview

These templates solve the recurring problem of implementing identical screen patterns with proper safe area handling, tab bar spacing, and gesture support. Instead of copy-pasting layout code across multiple screens, use these templates to ensure consistency and reduce maintenance burden.

## Templates

### 1. MapSheetTemplate

**Use for:** Map-based screens with an overlaid bottom sheet

**Features:**
- Full-screen map view
- Bottom sheet overlay
- Optional map dimming when sheet expands
- Gesture handler support
- Automatic safe area handling

**Example:**
```tsx
import { MapSheetTemplate } from '@/src/ui/templates';
import { DestinationBottomSheet } from '@/src/features/home/components';

function HomeScreen() {
  const tabBarHeight = getTabBarHeight(insets);

  return (
    <MapSheetTemplate
      mapProps={{
        initialRegion: INITIAL_REGION,
        showsUserLocation: true,
      }}
      sheet={
        <DestinationBottomSheet bottomInset={tabBarHeight} />
      }
      showMapDim={false}
    />
  );
}
```

**Props:**
- `mapProps` - MapView component props
- `sheet` - Bottom sheet component
- `showMapDim?` - Show dim overlay when sheet expands (default: false)
- `mapDimOpacity?` - Opacity of dim overlay 0-1 (default: 0.3)

---

### 2. ListScreenTemplate

**Use for:** List/browse screens with iOS-style collapsing headers

**Features:**
- Large title (32px, bold)
- Optional subtitle
- Optional header content (filters, search bars, etc.)
- ScrollView or FlatList support
- Automatic safe area and tab bar spacing

**Example (ScrollView):**
```tsx
import { ListScreenTemplate } from '@/src/ui/templates';

function ExploreScreen() {
  return (
    <ListScreenTemplate
      title="Explore"
      subtitle="Discover places in Sint Maarten"
      scrollable={true}
      headerContent={<SearchBar />}
    >
      <FeaturedSection />
      <NearbySection />
    </ListScreenTemplate>
  );
}
```

**Example (FlatList):**
```tsx
import { ListScreenTemplate } from '@/src/ui/templates';

function DriversScreen() {
  return (
    <ListScreenTemplate
      title="Available Drivers"
      subtitle="Browse and contact drivers"
      scrollable={false}
      headerContent={<FilterPills />}
      flatList={
        <FlatList
          data={drivers}
          renderItem={({ item }) => <DriverCard driver={item} />}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      }
    />
  );
}
```

**Props:**
- `title` - Large title text
- `subtitle?` - Optional subtitle
- `headerContent?` - Optional header content (filters, search, etc.)
- `scrollable` - true for ScrollView, false for custom FlatList
- `scrollViewProps?` - Additional ScrollView props (when scrollable=true)
- `flatList?` - FlatList component (when scrollable=false)
- `extraBottomPadding?` - Additional bottom padding beyond tab bar (default: 20)

---

### 3. DetailScreenTemplate

**Use for:** Detail screens with hero header and optional sticky CTA

**Features:**
- Hero header section
- Scrollable content area
- Optional sticky CTA button
- Automatic scroll padding to prevent content hiding
- Safe area and tab bar handling

**Example:**
```tsx
import { DetailScreenTemplate, StickyCtaButton } from '@/src/ui/templates';

function VenueDetailScreen() {
  return (
    <DetailScreenTemplate
      header={
        <VenueHeader
          venue={venue}
          onSavePress={handleSave}
          isSaved={isSaved}
        />
      }
      stickyButton={
        <StickyCtaButton
          label="Get a ride"
          onPress={handleBookRide}
          content={
            <Text>Est. trip: 12 min</Text>
          }
        />
      }
    >
      <AboutSection />
      <MapPreview />
      <AmenitiesSection />
    </DetailScreenTemplate>
  );
}
```

**Props:**
- `header` - Hero header component
- `children` - Scrollable content
- `stickyButton?` - Optional sticky CTA button
- `scrollViewProps?` - Additional ScrollView props

---

### 4. StickyCtaButton

**Use for:** Sticky call-to-action buttons at bottom of screen

**Features:**
- Sticky positioning above tab bar
- Respects safe areas
- Optional content area above button
- Primary and secondary variants
- Disabled and loading states
- Shadow and rounded corners

**Example:**
```tsx
import { StickyCtaButton } from '@/src/ui/templates';

function DriverProfileScreen() {
  return (
    <>
      <ScrollView>{/* content */}</ScrollView>

      <StickyCtaButton
        label="Book Ride"
        onPress={handleBookRide}
        disabled={!driverOnDuty}
        content={
          <View>
            <Text>Driver: {driver.name}</Text>
            <Text>Response time: ~5 min</Text>
          </View>
        }
      />
    </>
  );
}
```

**Props:**
- `label` - Button text
- `onPress` - Button press handler
- `content?` - Optional content above button
- `disabled?` - Disable button (default: false)
- `loading?` - Loading state (default: false)
- `variant?` - 'primary' or 'secondary' (default: 'primary')
- `containerStyle?` - Additional container style
- `buttonStyle?` - Additional button style

---

## Hook: useStickyCta

**Use for:** Custom sticky CTA implementations

Returns positioning values for sticky CTAs that respect tab bar and safe areas.

**Example:**
```tsx
import { useStickyCta } from '@/src/hooks/use-sticky-cta';

function CustomScreen() {
  const { bottom, paddingBottom } = useStickyCta();

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingBottom }}
      >
        {/* Your content */}
      </ScrollView>

      <View style={{ position: 'absolute', bottom }}>
        <CustomButton />
      </View>
    </>
  );
}
```

**Returns:**
```typescript
{
  bottom: number;           // Bottom position for absolutely positioned CTA
  tabBarHeight: number;     // Tab bar height (includes safe area)
  safeAreaBottom: number;   // Safe area bottom inset
  paddingBottom: number;    // Recommended padding for ScrollView content
}
```

**Options:**
- `extraOffset?` - Additional offset to add to bottom position (default: 0)

---

## Design Principles

### 1. Safe Area Handling
All templates automatically handle safe areas (notches, home indicators) and tab bar spacing. You don't need to manually add padding.

### 2. Consistency
Using these templates ensures:
- Consistent large title sizing (32px, bold)
- Consistent spacing (20px horizontal padding)
- Consistent tab bar offsets
- Consistent safe area handling

### 3. Flexibility
Templates are compositional - you provide the content, they provide the layout. Mix and match as needed.

### 4. No Over-Engineering
Templates are simple wrappers around common patterns. If you need something custom, don't force it into a template.

---

## Migration Guide

### Before (Home Screen):
```tsx
function HomeScreen() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <MapView style={styles.map} {...mapProps} />
        <DestinationBottomSheet />
      </View>
    </GestureHandlerRootView>
  );
}
```

### After:
```tsx
function HomeScreen() {
  return (
    <MapSheetTemplate
      mapProps={mapProps}
      sheet={<DestinationBottomSheet />}
    />
  );
}
```

### Before (Explore Screen):
```tsx
function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Explore</ThemedText>
        <SearchBar />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {content}
      </ScrollView>
    </ThemedView>
  );
}
```

### After:
```tsx
function ExploreScreen() {
  return (
    <ListScreenTemplate
      title="Explore"
      scrollable={true}
      headerContent={<SearchBar />}
    >
      {content}
    </ListScreenTemplate>
  );
}
```

---

## Testing Checklist

When using these templates, verify:

- [ ] Safe area handled correctly on iPhone with notch
- [ ] Tab bar doesn't overlap content
- [ ] Sticky CTA button doesn't overlap tab bar
- [ ] Scrollable content has proper bottom padding
- [ ] Large title displays correctly
- [ ] Map gestures work (MapSheetTemplate)
- [ ] Sheet gestures work (MapSheetTemplate)
- [ ] Works on both iOS and Android
- [ ] Works in both portrait and landscape (if applicable)

---

## Related Documentation

- [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) - Overall design system
- [UX_WIREFRAME_AUDIT.md](../../../UX_WIREFRAME_AUDIT.md) - Screen patterns audit
- [BOTTOM_SHEET_AUDIT.md](../../../BOTTOM_SHEET_AUDIT.md) - Bottom sheet implementation

---

## Support

If you encounter issues or need a pattern not covered by these templates:

1. Check existing screen implementations for examples
2. Review the UX audit document for design requirements
3. Consider if a new template is needed or if customization is simpler
4. Follow the CLAUDE.md guidelines for proposing changes
