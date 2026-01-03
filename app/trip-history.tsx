import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/src/ui/components/Badge';
import { Card } from '@/src/ui/components/Card';
import { EmptyState } from '@/src/ui/components/EmptyState';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { useTripHistoryStore } from '@/src/store/trip-history-store';
import type { TripStatus } from '@/src/types/trip';
import { Ionicons } from '@expo/vector-icons';

type FilterTab = 'all' | TripStatus | 'saved';

export default function TripHistoryScreen() {
  const { trips } = useTripHistoryStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Filter trips based on active tab
  const filteredTrips = trips.filter((trip) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'saved') return trip.saved;
    return trip.status === activeFilter;
  });

  const getStatusBadge = (status: TripStatus) => {
    const statusConfig: Record<
      TripStatus,
      { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'primary' }
    > = {
      not_taken: { label: 'Not Taken', tone: 'neutral' },
      pending: { label: 'Pending', tone: 'warning' },
      in_progress: { label: 'In Progress', tone: 'primary' },
      completed: { label: 'Completed', tone: 'success' },
      cancelled: { label: 'Cancelled', tone: 'danger' },
    };
    return statusConfig[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h3" style={styles.headerTitle}>
          Trip History
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        {(['all', 'not_taken', 'pending', 'in_progress', 'completed', 'cancelled', 'saved'] as FilterTab[]).map(
          (filter) => {
            const filterLabels: Record<FilterTab, string> = {
              all: 'All',
              not_taken: 'Not Taken',
              pending: 'Pending',
              in_progress: 'In Progress',
              completed: 'Completed',
              cancelled: 'Cancelled',
              saved: 'Saved',
            };

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}>
                <Text
                  variant="body"
                  style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                  {filterLabels[filter]}
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      {/* Trips List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredTrips.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="car-outline" size={48} color={colors.textMuted} />}
            message={
              activeFilter === 'all'
                ? 'No trips yet. Book your first ride!'
                : `No ${activeFilter === 'saved' ? 'saved' : activeFilter} trips.`
            }
            actionLabel="Explore"
            onAction={() => router.push('/(tabs)/explore')}
          />
        ) : (
          filteredTrips.map((trip) => {
            const statusBadge = getStatusBadge(trip.status);
            return (
              <Pressable
                key={trip.id}
                onPress={() => {
                  // Navigate to trip detail (to be implemented)
                  console.log('Navigate to trip detail:', trip.id);
                }}>
                <Card style={styles.tripCard}>
                  <Box style={styles.tripHeader}>
                    <Box style={styles.tripHeaderLeft}>
                      <Badge label={statusBadge.label} tone={statusBadge.tone} />
                      {trip.saved && (
                        <Ionicons name="bookmark" size={16} color={colors.primary} style={{ marginLeft: space[2] }} />
                      )}
                    </Box>
                    <Text variant="sub" muted>
                      {formatDate(trip.createdAt)}
                    </Text>
                  </Box>

                  <Box style={styles.tripRoute}>
                    <Box style={styles.routeRow}>
                      <Ionicons name="location" size={20} color={colors.primary} />
                      <Text variant="body" style={styles.routeText} numberOfLines={1}>
                        {trip.origin.name}
                      </Text>
                    </Box>
                    <Box style={styles.routeDivider}>
                      <View style={styles.routeLine} />
                      <Ionicons name="arrow-down" size={16} color={colors.textMuted} />
                    </Box>
                    <Box style={styles.routeRow}>
                      <Ionicons name="location" size={20} color={colors.danger} />
                      <Text variant="body" style={styles.routeText} numberOfLines={1}>
                        {trip.destination.name}
                      </Text>
                    </Box>
                  </Box>

                  <Box style={styles.tripFooter}>
                    <Box style={styles.tripStats}>
                      <Box style={styles.statItem}>
                        <Ionicons name="speedometer-outline" size={16} color={colors.textMuted} />
                        <Text variant="sub" muted>
                          {trip.distance.toFixed(1)} km
                        </Text>
                      </Box>
                      <Box style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                        <Text variant="sub" muted>
                          {trip.duration} min
                        </Text>
                      </Box>
                    </Box>
                    <Text variant="h4" style={styles.tripPrice}>
                      {formatPrice(trip.price)}
                    </Text>
                  </Box>

                  {trip.driverId && (
                    <Box style={styles.driverInfo}>
                      <Ionicons name="person-circle-outline" size={20} color={colors.textMuted} />
                      <Text variant="sub" muted>
                        Driver assigned
                      </Text>
                    </Box>
                  )}
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContent: {
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[2],
  },
  filterTab: {
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
    gap: space[4],
  },
  tripCard: {
    padding: space[4],
    gap: space[3],
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripRoute: {
    gap: space[2],
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  routeText: {
    flex: 1,
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space[2],
    gap: space[2],
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tripStats: {
    flexDirection: 'row',
    gap: space[4],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  tripPrice: {
    fontWeight: '700',
    color: colors.primary,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingTop: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
