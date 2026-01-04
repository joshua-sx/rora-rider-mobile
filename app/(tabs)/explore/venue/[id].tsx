import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/src/ui/components/themed-text';
import { ThemedView } from '@/src/ui/components/themed-view';
import { VenueHeader } from '@/src/features/explore/components/venue-header';
import { RideCtaCard } from '@/src/features/explore/components/ride-cta-card';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { useStickyCta } from '@/src/hooks/use-sticky-cta';
import { getVenueById } from '@/src/features/explore/data/venues';
import { useRouteStore } from '@/src/store/route-store';
import { getTabBarHeight } from '@/src/utils/safe-area';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollViewPadding } = useStickyCta(RIDE_CTA_CARD_HEIGHT);

  const [isSaved, setIsSaved] = useState(false);

  const { setDestination, setOrigin } = useRouteStore();

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const cardBackgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const subtextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );
  const primaryColor = useThemeColor({}, 'tint');

  const venue = getVenueById(id);

  const handleSavePress = useCallback(() => {
    setIsSaved((prev) => !prev);
  }, []);

  const handleRidePress = useCallback(() => {
    if (!venue) return;

    // Clear any stale origin to ensure we use current location
    setOrigin(null);

    // Set venue as destination in route store
    setDestination({
      placeId: venue.id,
      name: venue.name,
      description: venue.description,
      coordinates: { latitude: venue.latitude, longitude: venue.longitude },
    });

    // Navigate directly to route input (will auto-calculate when origin is set)
    router.push('/route-input');
  }, [venue, router, setDestination, setOrigin]);

  if (!venue) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={subtextColor} />
          <ThemedText style={styles.errorText}>Venue not found</ThemedText>
          <Pressable
            style={[styles.backButton, { borderColor: primaryColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.backButtonText, { color: primaryColor }]}>
              Go back
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <VenueHeader
            venue={venue}
            onSavePress={handleSavePress}
            isSaved={isSaved}
          />

          {/* About Section */}
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={styles.sectionTitle}>ABOUT</ThemedText>
            <ThemedText style={styles.description}>{venue.description}</ThemedText>
          </View>

          {/* Hours & Info Section */}
          {(venue.hours || venue.amenities) && (
            <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
              {venue.hours && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color={subtextColor} />
                  <ThemedText style={styles.infoText}>{venue.hours}</ThemedText>
                </View>
              )}
              {venue.amenities && venue.amenities.length > 0 && (
                <View style={styles.amenitiesContainer}>
                  {venue.amenities.map((amenity, index) => (
                    <View key={index} style={styles.infoRow}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={primaryColor}
                      />
                      <ThemedText style={styles.amenityText}>{amenity}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Map Preview */}
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={styles.sectionTitle}>LOCATION</ThemedText>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: venue.latitude,
                  longitude: venue.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                  }}
                  pinColor={primaryColor}
                />
              </MapView>
            </View>
            <View style={styles.distanceRow}>
              <Ionicons name="navigate-outline" size={18} color={subtextColor} />
              <ThemedText style={[styles.distanceText, { color: subtextColor }]}>
                {venue.distance} km away · {venue.estimatedDuration || 12} min drive
              </ThemedText>
            </View>
          </View>

          {/* Bottom Padding for CTA */}
          <View style={{ height: scrollViewPadding }} />
        </ScrollView>

        {/* Sticky Bottom CTA */}
        <RideCtaCard venue={venue} onPress={handleRidePress} />
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
  },
  amenitiesContainer: {
    marginTop: 8,
  },
  amenityText: {
    fontSize: 14,
  },
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
