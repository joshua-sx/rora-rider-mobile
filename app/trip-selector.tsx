import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing } from '@/constants/design-tokens';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTripHistoryStore } from '@/store/trip-history-store';
import { formatDistance, formatDuration, formatPrice } from '@/utils/pricing';
import type { Trip } from '@/types/trip';

export default function TripSelectorScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { getNotTakenTrips, updateTripStatus } = useTripHistoryStore();
  const notTakenTrips = getNotTakenTrips();

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

  const handleBack = () => {
    router.back();
  };

  const handleSelectTrip = (trip: Trip) => {
    if (!driverId) return;

    // Update trip status and assign driver
    updateTripStatus(trip.id, 'pending', driverId);

    // Navigate to QR code screen
    router.push(`/trip-qr/${trip.id}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <Pressable
      style={({ pressed }) => [
        styles.tripCard,
        { backgroundColor: cardBackgroundColor, borderColor },
        pressed && styles.tripCardPressed,
      ]}
      onPress={() => handleSelectTrip(item)}
    >
      {/* Route Info */}
      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <Ionicons name="location" size={18} color={tintColor} />
          <View style={styles.routeTextContainer}>
            <ThemedText style={styles.routeLabel}>From</ThemedText>
            <ThemedText style={styles.routeName} numberOfLines={1}>
              {item.origin.name}
            </ThemedText>
          </View>
        </View>

        <View style={styles.routeConnector}>
          <View style={[styles.connectorLine, { backgroundColor: borderColor }]} />
          <Ionicons name="arrow-down" size={16} color={secondaryTextColor} />
        </View>

        <View style={styles.routeRow}>
          <Ionicons name="location" size={18} color="#FF5733" />
          <View style={styles.routeTextContainer}>
            <ThemedText style={styles.routeLabel}>To</ThemedText>
            <ThemedText style={styles.routeName} numberOfLines={1}>
              {item.destination.name}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { borderTopColor: borderColor }]}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={16} color={secondaryTextColor} />
          <ThemedText style={[styles.statText, { color: secondaryTextColor }]}>
            {formatDuration(item.routeData.duration)}
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <Ionicons name="car-outline" size={16} color={secondaryTextColor} />
          <ThemedText style={[styles.statText, { color: secondaryTextColor }]}>
            {formatDistance(item.routeData.distance)}
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.price}>
            {formatPrice(item.routeData.price)}
          </ThemedText>
        </View>
      </View>

      {/* Date */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={secondaryTextColor} />
        <ThemedText style={[styles.dateText, { color: secondaryTextColor }]}>
          Saved {formatDate(item.timestamp)}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="close" size={28} color={textColor} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Select a Trip</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      {/* Trip List */}
      <FlatList
        data={notTakenTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="car-outline"
              size={64}
              color={secondaryTextColor}
              style={styles.emptyIcon}
            />
            <ThemedText style={styles.emptyTitle}>No Saved Trips</ThemedText>
            <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
              You haven't saved any trip quotes yet. Create a new route to get
              started!
            </ThemedText>
            <Pressable
              style={[styles.newTripButton, { backgroundColor: tintColor }]}
              onPress={() => router.push('/route-input')}
            >
              <ThemedText style={styles.newTripButtonText}>Create New Trip</ThemedText>
            </Pressable>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  tripCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tripCardPressed: {
    opacity: 0.7,
  },
  routeSection: {
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
    marginBottom: 2,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '500',
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 9,
    paddingVertical: 4,
  },
  connectorLine: {
    width: 2,
    height: 20,
    marginRight: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl * 2,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  newTripButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
  },
  newTripButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

