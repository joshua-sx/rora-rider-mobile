import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VenueListItem } from '@/components/explore/venue-list-item';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getFeaturedVenues } from '@/data/venues';
import type { Venue } from '@/types/venue';

type FilterType = 'all' | 'near_me' | 'top_rated';

export default function FeaturedVenuesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const headerBackgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const subtextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );
  const primaryColor = useThemeColor({}, 'tint');

  const featuredVenues = getFeaturedVenues();

  const filteredVenues = featuredVenues.filter((venue) => {
    switch (activeFilter) {
      case 'near_me':
        return venue.distance < 5;
      case 'top_rated':
        return venue.rating >= 4.5;
      default:
        return true;
    }
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'top_rated', label: 'Top Rated' },
    { key: 'near_me', label: 'Near Me' },
  ];

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleVenuePress = useCallback(
    (venue: Venue) => {
      router.push(`/explore/venue/${venue.id}`);
    },
    [router]
  );

  const handleFilterPress = useCallback((filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter));
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: headerBackgroundColor },
        ]}
      >
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={subtextColor} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Featured</ThemedText>
          <View style={styles.headerRight} />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <Pressable
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && {
                  backgroundColor: primaryColor,
                },
              ]}
              onPress={() => handleFilterPress(filter.key)}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Venue List */}
      <FlatList
        data={filteredVenues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <VenueListItem venue={item} onPress={handleVenuePress} showCategory />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color={subtextColor} />
            <ThemedText style={styles.emptyTitle}>No featured venues found</ThemedText>
            <Pressable
              style={[styles.resetButton, { borderColor: primaryColor }]}
              onPress={() => setActiveFilter('all')}
            >
              <ThemedText style={[styles.resetButtonText, { color: primaryColor }]}>
                Reset filters
              </ThemedText>
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
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEF3ED',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

