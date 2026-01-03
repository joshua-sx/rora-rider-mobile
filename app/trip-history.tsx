import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/src/ui/components/Badge';
import { Card } from '@/src/ui/components/Card';
import { IconButton } from '@/src/ui/components/IconButton';
import { TripSkeleton } from '@/src/ui/components/TripSkeleton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { useTripHistoryStore } from '@/src/store/trip-history-store';
import type { TripStatus } from '@/src/types/trip';

type FilterTab = 'past' | 'upcoming';

export default function TripHistoryScreen() {
  const { trips } = useTripHistoryStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('past');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter trips based on active tab
  const filteredTrips = trips.filter((trip) => {
    if (activeFilter === 'past') {
      // Show completed and cancelled trips
      return trip.status === 'completed' || trip.status === 'cancelled';
    } else {
      // Show upcoming: not_taken, pending, in_progress
      return trip.status === 'not_taken' || trip.status === 'pending' || trip.status === 'in_progress';
    }
  });

  // Group trips by month for past trips
  const groupedTrips = filteredTrips.reduce((acc, trip) => {
    const date = new Date(trip.quote.createdAt || trip.timestamp);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(trip);
    return acc;
  }, {} as Record<string, typeof trips>);

  const getStatusBadge = (status: TripStatus) => {
    const statusConfig: Record<
      TripStatus,
      { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'primary' }
    > = {
      not_taken: { label: 'Scheduled', tone: 'neutral' },
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

  const renderEmptyState = () => {
    if (activeFilter === 'upcoming') {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="calendar-outline" size={80} color={colors.textMuted} />
          </View>
          <Text variant="h3" style={styles.emptyTitle}>
            No upcoming trips
          </Text>
          <Text variant="body" muted style={styles.emptyMessage}>
            When you schedule a trip, it will appear here
          </Text>
          <Pressable
            onPress={() => router.push('/route-input')}
            style={styles.emptyButton}
          >
            <Text variant="body" style={styles.emptyButtonText}>
              Schedule a trip
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIllustration}>
          <Ionicons name="car-outline" size={80} color={colors.textMuted} />
        </View>
        <Text variant="h3" style={styles.emptyTitle}>
          No past trips
        </Text>
        <Text variant="body" muted style={styles.emptyMessage}>
          Your completed trips will appear here
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
          onPress={() => router.back()}
        />
        <Text variant="h2" style={styles.headerTitle}>
          Trips
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      {/* Segmented Control Tabs */}
      <View style={styles.segmentedControl}>
        <Pressable
          onPress={() => setActiveFilter('past')}
          style={[
            styles.segmentButton,
            activeFilter === 'past' && styles.segmentButtonActive,
          ]}
        >
          <Text
            variant="body"
            style={[
              styles.segmentText,
              activeFilter === 'past' && styles.segmentTextActive,
            ]}
          >
            Past
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter('upcoming')}
          style={[
            styles.segmentButton,
            activeFilter === 'upcoming' && styles.segmentButtonActive,
          ]}
        >
          <Text
            variant="body"
            style={[
              styles.segmentText,
              activeFilter === 'upcoming' && styles.segmentTextActive,
            ]}
          >
            Upcoming
          </Text>
        </Pressable>
      </View>

      {/* Trips List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          // Skeleton loaders
          <>
            <TripSkeleton />
            <TripSkeleton />
            <TripSkeleton />
          </>
        ) : filteredTrips.length === 0 ? (
          renderEmptyState()
        ) : activeFilter === 'past' ? (
          // Grouped by month for past trips
          Object.entries(groupedTrips).map(([monthYear, monthTrips]) => (
            <View key={monthYear} style={styles.monthGroup}>
              <Text variant="sub" muted style={styles.monthHeader}>
                {monthYear}
              </Text>
              {monthTrips.map((trip) => {
                const statusBadge = getStatusBadge(trip.status);
                return (
                  <Pressable
                    key={trip.id}
                    onPress={() => {
                      // Navigate to trip detail (to be implemented)
                      console.log('Navigate to trip detail:', trip.id);
                    }}
                  >
                    <Card style={styles.tripCard}>
                  <Box style={styles.tripHeader}>
                    <Box style={styles.tripHeaderLeft}>
                      <Badge label={statusBadge.label} tone={statusBadge.tone} />
                      {trip.saved && (
                        <Ionicons name="bookmark" size={16} color={colors.primary} style={{ marginLeft: space[2] }} />
                      )}
                    </Box>
                    <Text variant="sub" muted>
                      {formatDate(new Date(trip.quote.createdAt || trip.timestamp).toISOString())}
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
                          {trip.routeData.distance?.toFixed(1) || '0.0'} km
                        </Text>
                      </Box>
                      <Box style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                        <Text variant="sub" muted>
                          {trip.routeData.duration} min
                        </Text>
                      </Box>
                    </Box>
                    <Text variant="body" style={styles.tripPrice}>
                      {formatPrice(trip.routeData.price)}
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
              })}
            </View>
          ))
        ) : (
          // Upcoming trips (not grouped)
          filteredTrips.map((trip) => {
            const statusBadge = getStatusBadge(trip.status);
            return (
              <Pressable
                key={trip.id}
                onPress={() => {
                  // Navigate to trip detail (to be implemented)
                  console.log('Navigate to trip detail:', trip.id);
                }}
              >
                <Card style={styles.tripCard}>
                  <Box style={styles.tripHeader}>
                    <Box style={styles.tripHeaderLeft}>
                      <Badge label={statusBadge.label} tone={statusBadge.tone} />
                      {trip.saved && (
                        <Ionicons
                          name="bookmark"
                          size={16}
                          color={colors.primary}
                          style={{ marginLeft: space[2] }}
                        />
                      )}
                    </Box>
                    <Text variant="sub" muted>
                      {formatDate(new Date(trip.quote.createdAt || trip.timestamp).toISOString())}
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
                          {trip.routeData.distance?.toFixed(1) || '0.0'} km
                        </Text>
                      </Box>
                      <Box style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                        <Text variant="sub" muted>
                          {trip.routeData.duration} min
                        </Text>
                      </Box>
                    </Box>
                    <Text variant="body" style={styles.tripPrice}>
                      {formatPrice(trip.routeData.price)}
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
  segmentedControl: {
    flexDirection: 'row',
    margin: space[4],
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: space[1],
  },
  segmentButton: {
    flex: 1,
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
  },
  monthGroup: {
    marginBottom: space[6],
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[3],
    paddingHorizontal: space[2],
  },
  tripCard: {
    padding: space[4],
    gap: space[3],
    marginBottom: space[3],
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[9],
    paddingHorizontal: space[6],
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[5],
  },
  emptyTitle: {
    marginBottom: space[2],
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: space[6],
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: space[3],
    paddingHorizontal: space[6],
    borderRadius: 24,
  },
  emptyButtonText: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});
