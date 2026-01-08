import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Spacing } from '@/src/constants/design-tokens';
import { VEHICLE_SEATS } from '@/src/constants/vehicle';
import { DriverCard } from '@/src/features/drivers/components/driver-card';
import {
  FilterModal,
  type DriverFilters,
} from '@/src/features/drivers/components/FilterModal';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { fetchDrivers } from '@/src/services/drivers.service';
import type { Driver } from '@/src/types/driver';
import { ThemedText } from '@/src/ui/components/themed-text';
import { ThemedView } from '@/src/ui/components/themed-view';
import { getTabBarHeight } from '@/src/utils/safe-area';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = Spacing.md;
const HORIZONTAL_PADDING = Spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const DEFAULT_FILTERS: DriverFilters = {
  dutyStatus: false,
  seats: 'Any',
  vehicleType: 'Any',
  rating: 'Any',
  specializations: [],
};

export default function DriversScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DriverFilters>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadDrivers = useCallback(async () => {
    try {
      const data = await fetchDrivers();
      setAllDrivers(data);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDrivers();
  }, [loadDrivers]);

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const surfaceColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const textColor = useThemeColor({ light: '#262626', dark: '#E5E7EA' }, 'text');
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );
  const borderColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );
  const tintColor = useThemeColor({}, 'tint');

  // Apply filters and search
  const filteredDrivers = useMemo(() => {
    let result = allDrivers;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(query)
      );
    }

    // Duty status filter
    if (filters.dutyStatus) {
      result = result.filter((d) => d.onDuty);
    }

    // Seats filter
    if (filters.seats !== 'Any') {
      result = result.filter((d) => {
        const driverSeats = d.seats || VEHICLE_SEATS[d.vehicleType] || 4;
        return driverSeats >= (filters.seats as number);
      });
    }

    // Vehicle type filter
    if (filters.vehicleType !== 'Any') {
      result = result.filter((d) => d.vehicleType === filters.vehicleType);
    }

    // Rating filter
    if (filters.rating !== 'Any') {
      result = result.filter((d) => d.rating >= (filters.rating as number));
    }

    // Specializations filter (AND logic - driver must have ALL selected specializations)
    if (filters.specializations.length > 0) {
      result = result.filter((d) => {
        if (!d.specializations || d.specializations.length === 0) return false;
        return filters.specializations.every((spec) =>
          d.specializations?.includes(spec) ?? false
        );
      });
    }

    return result;
  }, [allDrivers, searchQuery, filters]);

  const handleApplyFilters = useCallback((newFilters: DriverFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  if (loading) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading drivers...
        </ThemedText>
      </ThemedView>
    );
  }

  const hasActiveFilters =
    filters.dutyStatus ||
    filters.seats !== 'Any' ||
    filters.vehicleType !== 'Any' ||
    filters.rating !== 'Any' ||
    filters.specializations.length > 0 ||
    searchQuery.trim() !== '';

  return (
    <ThemedView
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
    >
      <View style={styles.stickyHeader}>
        <ThemedText style={styles.title}>Available Drivers</ThemedText>

        {/* Search Bar and Filters */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: surfaceColor, borderColor }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search drivers"
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              { backgroundColor: surfaceColor, borderColor },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={20} color={textColor} />
            {hasActiveFilters && <View style={[styles.filterBadge, { backgroundColor: tintColor }]} />}
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <DriverCard driver={item} />
          </View>
        )}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {/* Empty state illustration */}
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCard}>
                <View style={styles.emptyPalmTree}>
                  <Ionicons name="navigate" size={40} color="#8C9390" />
                </View>
                <View style={styles.emptyCar}>
                  <Ionicons name="car" size={48} color="#D0D3D7" />
                </View>
              </View>
            </View>

            <ThemedText style={styles.emptyTitle}>No drivers available</ThemedText>
            <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
              No drivers are currently available based on your filters. You can adjust the filters above to see more drivers.
            </ThemedText>

            {hasActiveFilters && (
              <Pressable
                style={[styles.clearFiltersButton, { borderColor }]}
                onPress={handleClearFilters}
              >
                <ThemedText style={[styles.clearFiltersText, { color: tintColor }]}>
                  Clear filters
                </ThemedText>
              </Pressable>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        isVisible={showFilterModal}
        onDismiss={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClearAll={handleClearFilters}
        matchingDriversCount={filteredDrivers.length}
        bottomInset={tabBarHeight}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  stickyHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(140, 147, 144, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyIllustration: {
    marginBottom: Spacing.xl,
  },
  emptyCard: {
    width: 200,
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.card,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPalmTree: {
    position: 'absolute',
    top: 20,
    right: 30,
  },
  emptyCar: {
    position: 'absolute',
    bottom: 30,
    left: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
