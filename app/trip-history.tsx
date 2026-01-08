import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTripHistoryStore } from '@/src/store/trip-history-store';
import { IconButton } from '@/src/ui/components/IconButton';
import { TripSkeleton } from '@/src/ui/components/TripSkeleton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

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

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const renderEmptyState = () => {
    if (activeFilter === 'upcoming') {
      return (
        <View style={styles.emptyContainer}>
          {/* Calendar illustration with green accent */}
          <View style={styles.calendarIllustration}>
            <View style={styles.calendarHeader} />
            <View style={styles.calendarBody}>
              <View style={styles.calendarGrid}>
                <View style={[styles.calendarSquare, { opacity: 0.3 }]} />
                <View style={[styles.calendarSquare, { opacity: 0.3 }]} />
                <View style={[styles.calendarSquare, { backgroundColor: colors.primary }]} />
                <View style={[styles.calendarSquare, { opacity: 0.3 }]} />
              </View>
            </View>
            <View style={styles.clockBadge}>
              <Ionicons name="time" size={24} color={colors.primary} />
            </View>
          </View>

          <Text variant="h2" style={styles.emptyTitle}>
            No upcoming rides
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            Whatever is on your schedule, a Scheduled{'\n'}Ride can get you there on time
          </Text>
          <Pressable
            onPress={() => router.push('/route-input')}
            style={styles.emptyButton}
          >
            <Text variant="body" style={styles.emptyButtonText}>
              Schedule a ride
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              // Navigate to info screen
              console.log('Learn how it works');
            }}
            style={styles.learnMoreButton}
          >
            <Text variant="body" style={styles.learnMoreText}>
              Learn how it works
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
        <Text variant="h2" style={styles.emptyTitle}>
          No past rides
        </Text>
        <Text variant="body" muted style={styles.emptyMessage}>
          Your completed rides will appear here
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Ride History
        </Text>
        <IconButton
          accessibilityLabel="Info"
          onPress={() => {
            // Navigate to info/help screen
            console.log('Show info');
          }}
        >
          <Ionicons name="information-circle-outline" size={28} color={colors.textMuted} />
        </IconButton>
      </Box>

      {/* Underline-style Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveFilter('past')}
          style={styles.tab}
        >
          <Text
            variant="body"
            style={[
              styles.tabText,
              activeFilter === 'past' && styles.tabTextActive,
            ]}
          >
            Past
          </Text>
          {activeFilter === 'past' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          onPress={() => setActiveFilter('upcoming')}
          style={styles.tab}
        >
          <Text
            variant="body"
            style={[
              styles.tabText,
              activeFilter === 'upcoming' && styles.tabTextActive,
            ]}
          >
            Upcoming
          </Text>
          {activeFilter === 'upcoming' && <View style={styles.tabIndicator} />}
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
                const tripDate = new Date(trip.quote.createdAt || trip.timestamp);
                const timeString = tripDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: false
                });
                const dateString = tripDate.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short'
                });

                return (
                  <Pressable
                    key={trip.id}
                    onPress={() => {
                      console.log('Navigate to trip detail:', trip.id);
                    }}
                  >
                    <View style={styles.tripCard}>
                      <View style={styles.tripCardHeader}>
                        <View style={styles.tripDateTime}>
                          <Text style={styles.tripDate}>{dateString}</Text>
                          <Text style={styles.tripTime}> · {timeString}</Text>
                        </View>
                        <Pressable hitSlop={8}>
                          <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={colors.textMuted} />
                        </Pressable>
                      </View>

                      <View style={styles.tripDestination}>
                        <Ionicons name="car-outline" size={20} color={colors.text} style={{ marginRight: space[2] }} />
                        <Text style={styles.tripAddress} numberOfLines={1}>
                          {trip.destination.name}
                        </Text>
                      </View>

                      <Text style={styles.tripPriceBolt}>
                        {formatPrice(trip.routeData.price)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        ) : (
          // Upcoming trips (not grouped)
          filteredTrips.map((trip) => {
            const tripDate = new Date(trip.quote.createdAt || trip.timestamp);
            const timeString = tripDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: false
            });
            const dateString = tripDate.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short'
            });

            return (
              <Pressable
                key={trip.id}
                onPress={() => {
                  console.log('Navigate to trip detail:', trip.id);
                }}
              >
                <View style={styles.tripCard}>
                  <View style={styles.tripCardHeader}>
                    <View style={styles.tripDateTime}>
                      <Text style={styles.tripDate}>{dateString}</Text>
                      <Text style={styles.tripTime}> · {timeString}</Text>
                    </View>
                    <Pressable hitSlop={8}>
                      <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={colors.textMuted} />
                    </Pressable>
                  </View>

                  <View style={styles.tripDestination}>
                    <Ionicons name="car-outline" size={20} color={colors.text} style={{ marginRight: space[2] }} />
                    <Text style={styles.tripAddress} numberOfLines={1}>
                      {trip.destination.name}
                    </Text>
                  </View>

                  <Text style={styles.tripPriceBolt}>
                    {formatPrice(trip.routeData.price)}
                  </Text>
                </View>
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
    backgroundColor: colors.surface,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: space[5],
  },
  tab: {
    paddingVertical: space[3],
    paddingHorizontal: space[2],
    marginRight: space[6],
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: space[4],
    paddingHorizontal: space[1],
    color: colors.text,
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: space[4],
    marginBottom: space[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[3],
  },
  tripDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDate: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tripTime: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '400',
  },
  tripDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[3],
  },
  tripAddress: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '400',
    flex: 1,
  },
  tripPriceBolt: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[5],
  },
  calendarIllustration: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[6],
    position: 'relative',
  },
  calendarHeader: {
    width: 120,
    height: 30,
    backgroundColor: '#2D2D2D',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  calendarBody: {
    width: 120,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: space[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  calendarSquare: {
    width: 20,
    height: 20,
    backgroundColor: colors.textMuted,
    borderRadius: 4,
  },
  clockBadge: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: space[3],
    textAlign: 'center',
    color: colors.text,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: space[6],
    color: colors.textMuted,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: space[4],
    paddingHorizontal: space[8],
    borderRadius: 28,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: space[3],
  },
  emptyButtonText: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 16,
  },
  learnMoreButton: {
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  learnMoreText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
