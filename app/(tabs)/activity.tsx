import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTripHistoryStore } from "@/src/store/trip-history-store";
import type { Trip } from "@/src/types/trip";
import { EmptyState } from "@/src/ui/components/EmptyState";
import { SegmentedControl } from "@/src/ui/components/SegmentedControl";
import { TripCard } from "@/src/ui/components/TripCard";
import { Box } from "@/src/ui/primitives/Box";
import { Text } from "@/src/ui/primitives/Text";
import { colors } from "@/src/ui/tokens/colors";
import { space } from "@/src/ui/tokens/spacing";
import { getTabBarHeight } from "@/src/utils/safe-area";

type TimeGroup = {
  title: string;
  trips: Trip[];
};

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);
  const { trips, seedDemoUpcomingTrip } = useTripHistoryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"past" | "upcoming">("past");

  // Seed demo data on first load if store is empty
  useEffect(() => {
    seedDemoUpcomingTrip();
  }, [seedDemoUpcomingTrip]);

  // Filter trips by active tab with proper temporal logic
  const filteredTrips = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return trips.filter((trip) => {
      const tripDate = new Date(trip.quote.createdAt || trip.timestamp);

      if (activeTab === "past") {
        // Past: completed/cancelled rides OR any ride with a past date
        const isPastDate = tripDate < todayStart;
        const isTerminalStatus = trip.status === "completed" || trip.status === "cancelled";
        return isPastDate || isTerminalStatus;
      }

      // Upcoming: future dates only, with active statuses
      const isFutureDate = tripDate >= todayStart;
      const isActiveStatus = ["not_taken", "pending", "in_progress"].includes(trip.status);
      return isFutureDate && isActiveStatus;
    });
  }, [trips, activeTab]);

  // Group trips by time periods (different logic for past vs upcoming)
  const groupedTrips = useMemo((): TimeGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (activeTab === "past") {
      // Past uses backward-looking groups
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);

      const groups: Record<string, Trip[]> = {
        Today: [],
        Yesterday: [],
        "This Week": [],
        Earlier: [],
      };

      filteredTrips.forEach((trip) => {
        const tripDate = new Date(trip.quote.createdAt || trip.timestamp);
        const tripDay = new Date(
          tripDate.getFullYear(),
          tripDate.getMonth(),
          tripDate.getDate()
        );

        if (tripDay.getTime() === today.getTime()) {
          groups.Today.push(trip);
        } else if (tripDay.getTime() === yesterday.getTime()) {
          groups.Yesterday.push(trip);
        } else if (tripDay >= thisWeekStart) {
          groups["This Week"].push(trip);
        } else {
          groups.Earlier.push(trip);
        }
      });

      return Object.entries(groups)
        .filter(([_, groupTrips]) => groupTrips.length > 0)
        .map(([title, groupTrips]) => ({ title, trips: groupTrips }));
    }

    // Upcoming uses forward-looking groups with human-readable dates
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    const groups: Record<string, Trip[]> = {};

    filteredTrips.forEach((trip) => {
      const tripDate = new Date(trip.quote.createdAt || trip.timestamp);
      const tripDay = new Date(
        tripDate.getFullYear(),
        tripDate.getMonth(),
        tripDate.getDate()
      );

      // Format as human-readable date: "Monday, Jan 13"
      const dateLabel = tripDay.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(trip);
    });

    // Sort by date (earliest first) and return
    return Object.entries(groups)
      .sort(([, tripsA], [, tripsB]) => {
        const dateA = new Date(tripsA[0].quote.createdAt || tripsA[0].timestamp);
        const dateB = new Date(tripsB[0].quote.createdAt || tripsB[0].timestamp);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([title, groupTrips]) => ({ title, trips: groupTrips }));
  }, [filteredTrips, activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in production, this would refetch from server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleTripPress = useCallback((trip: Trip) => {
    // Navigate to trip detail screen
    console.log("Navigate to trip detail:", trip.id);
    // router.push(`/trip/${trip.id}`);
  }, []);

  const renderEmpty = () => (
    <EmptyState
      icon={
        <Ionicons
          name={activeTab === "past" ? "checkmark-circle-outline" : "calendar-outline"}
          size={64}
          color={colors.textMuted}
        />
      }
      message={
        activeTab === "past"
          ? "No completed rides yet"
          : "No upcoming rides. Schedule a ride to get started!"
      }
      actionLabel={activeTab === "past" ? "Request a ride" : "Schedule a ride"}
      onAction={() => router.push(activeTab === "past" ? "/" : "/route-input")}
      style={styles.emptyState}
    />
  );

  const renderSectionHeader = ({ title }: TimeGroup) => (
    <Box style={styles.sectionHeader}>
      <Text variant="sub" muted style={styles.sectionTitle}>
        {title}
      </Text>
    </Box>
  );

  const renderTrip = ({ item }: { item: Trip }) => (
    <TripCard trip={item} onPress={() => handleTripPress(item)} showQuoteAge />
  );

  const data = groupedTrips;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Box style={styles.header}>
        <Text variant="title" style={styles.headerTitle}>
          Activity
        </Text>
        <Text variant="body" muted style={styles.headerSubtitle}>
          {activeTab === "past" ? "Your completed rides" : "Your scheduled rides"}
        </Text>
      </Box>

      {/* Tab Switcher */}
      <Box style={styles.tabContainer}>
        <SegmentedControl
          segments={["Past", "Upcoming"]}
          selectedIndex={activeTab === "past" ? 0 : 1}
          onChange={(index) => setActiveTab(index === 0 ? "past" : "upcoming")}
        />
      </Box>

      {/* Trip List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <Box>
            {renderSectionHeader(item)}
            {item.trips.map((trip) => (
              <Box key={trip.id} style={styles.tripWrapper}>
                {renderTrip({ item: trip })}
              </Box>
            ))}
          </Box>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + space[4] },
          data.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={<View style={{ height: space[2] }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: space[1],
  },
  headerSubtitle: {
    fontSize: 14,
  },
  tabContainer: {
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    paddingTop: space[4],
    paddingBottom: space[3],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tripWrapper: {
    marginBottom: space[3],
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
  },
});
