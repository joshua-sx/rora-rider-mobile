import { StyleSheet, View, Pressable, ScrollView, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { VenueListItem } from '@/components/explore/venue-list-item';
import type { Venue, CategoryInfo } from '@/types/venue';
import { CATEGORIES, searchVenues } from '@/data/venues';

type SearchResultsProps = {
  query: string;
  onVenuePress?: (venue: Venue) => void;
  onCategoryPress?: (category: CategoryInfo) => void;
};

export function SearchResults({
  query,
  onVenuePress,
  onCategoryPress,
}: SearchResultsProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);
  
  const backgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#0E0F0F' },
    'surface'
  );
  const borderColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );
  const subtextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );

  const venues = searchVenues(query);
  const matchingCategories = CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = venues.length > 0 || matchingCategories.length > 0;

  if (!query) {
    return null;
  }

  if (!hasResults) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor }]}>
        <Ionicons name="telescope-outline" size={64} color={subtextColor} />
        <ThemedText style={styles.emptyTitle}>No places found</ThemedText>
        <ThemedText style={[styles.emptySubtext, { color: subtextColor }]}>
          Try a different search or browse categories
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 120 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
    >
      {/* Category Suggestions */}
      {matchingCategories.length > 0 && (
        <View style={styles.section}>
          {matchingCategories.map((category) => (
            <Pressable
              key={category.slug}
              style={[styles.categoryItem, { borderColor }]}
              onPress={() => onCategoryPress?.(category)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color + '20' },
                ]}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={category.color}
                />
              </View>
              <View style={styles.categoryContent}>
                <ThemedText style={styles.categoryTitle}>
                  Search "{category.name}"
                </ThemedText>
                <ThemedText style={[styles.categorySubtitle, { color: subtextColor }]}>
                  Explore category
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={subtextColor} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Venue Results */}
      {venues.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: subtextColor }]}>
            PLACES
          </ThemedText>
          {venues.slice(0, 5).map((venue) => (
            <VenueListItem
              key={venue.id}
              venue={venue}
              onPress={onVenuePress}
              showCategory
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
