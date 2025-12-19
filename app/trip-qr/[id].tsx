import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing } from '@/constants/design-tokens';
import { getDriverById } from '@/data/drivers';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTripHistoryStore } from '@/store/trip-history-store';
import { formatDistance, formatDuration, formatPrice } from '@/utils/pricing';

export default function TripQRScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { getTripById, updateTripStatus } = useTripHistoryStore();
  const trip = getTripById(id);

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const cardBackgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const textColor = useThemeColor({ light: '#262626', dark: '#E5E7EA' }, 'text');
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#8B8F95' },
    'textSecondary'
  );
  const borderColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );
  const tintColor = useThemeColor({}, 'tint');

  const driver = trip?.driverId ? getDriverById(trip.driverId) : null;

  const handleBack = () => {
    router.back();
  };

  const handleCancelRide = () => {
    if (!trip) return;

    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? The trip will be returned to your saved trips.',
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            updateTripStatus(trip.id, 'not_taken');
            router.back();
          },
        },
      ]
    );
  };

  // Generate QR code data
  const qrData = trip
    ? JSON.stringify({
        tripId: trip.id,
        driverId: trip.driverId,
        timestamp: Date.now(),
        origin: trip.origin.name,
        destination: trip.destination.name,
        price: trip.routeData.price,
      })
    : '';

  if (!trip) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Trip not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Your Ride</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Trip Details Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={styles.sectionTitle}>TRIP DETAILS</ThemedText>

          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: tintColor }]} />
            <View style={styles.routeInfo}>
              <ThemedText style={styles.routeLabel}>Pickup</ThemedText>
              <ThemedText style={styles.routeName} numberOfLines={2}>
                {trip.origin.name}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.routeLine, { backgroundColor: borderColor }]} />

          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: '#FF5733' }]} />
            <View style={styles.routeInfo}>
              <ThemedText style={styles.routeLabel}>Dropoff</ThemedText>
              <ThemedText style={styles.routeName} numberOfLines={2}>
                {trip.destination.name}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.statsRow, { borderTopColor: borderColor }]}>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={18} color={secondaryTextColor} />
              <ThemedText style={[styles.statText, { color: secondaryTextColor }]}>
                {formatDuration(trip.routeData.duration)}
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <Ionicons name="car-outline" size={18} color={secondaryTextColor} />
              <ThemedText style={[styles.statText, { color: secondaryTextColor }]}>
                {formatDistance(trip.routeData.distance)}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.priceRow, { borderTopColor: borderColor }]}>
            <ThemedText style={styles.priceLabel}>Estimated Fare</ThemedText>
            <ThemedText style={styles.price}>
              {formatPrice(trip.routeData.price)}
            </ThemedText>
          </View>
        </View>

        {/* Driver Details Section */}
        {driver && (
          <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
            <ThemedText style={styles.sectionTitle}>DRIVER</ThemedText>

            <View style={styles.driverRow}>
              <View style={[styles.driverImage, { backgroundColor: borderColor }]}>
                <Ionicons name="person" size={28} color={secondaryTextColor} />
              </View>
              <View style={styles.driverInfo}>
                <ThemedText style={styles.driverName}>{driver.name}</ThemedText>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <ThemedText style={styles.rating}>
                    {driver.rating.toFixed(1)}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={18} color={secondaryTextColor} />
              <ThemedText style={[styles.infoText, { color: secondaryTextColor }]}>
                {driver.vehicleModel} • {driver.licensePlate}
              </ThemedText>
            </View>
          </View>
        )}

        {/* QR Code Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={styles.sectionTitle}>QR CODE</ThemedText>

          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode value={qrData} size={220} backgroundColor="white" />
            </View>
            <ThemedText
              style={[styles.qrLabel, { color: secondaryTextColor }]}
            >
              For driver to scan
            </ThemedText>
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: `${tintColor}15` }]}>
          <Ionicons
            name="information-circle"
            size={24}
            color={tintColor}
            style={styles.instructionIcon}
          />
          <View style={styles.instructionTextContainer}>
            <ThemedText style={styles.instructionTitle}>Safety & Verification</ThemedText>
            <ThemedText style={[styles.instructionText, { color: secondaryTextColor }]}>
              Show this QR code to your driver before starting the trip. The driver
              will scan it to verify and log the ride for your safety and
              accountability.
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
            borderTopColor: borderColor,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            { borderColor },
            pressed && styles.cancelButtonPressed,
          ]}
          onPress={handleCancelRide}
        >
          <ThemedText style={styles.cancelButtonText}>Cancel Ride</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
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
    paddingBottom: Spacing.xxl + 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
    marginBottom: 2,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  driverImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoText: {
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  qrWrapper: {
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.md,
  },
  qrLabel: {
    fontSize: 13,
  },
  instructionsCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    gap: Spacing.md,
  },
  instructionIcon: {
    marginTop: 2,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cancelButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.button,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

