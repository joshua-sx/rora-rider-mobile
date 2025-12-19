import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriverCard } from '@/components/driver-card';
import { getHeaderTopPadding } from '@/utils/safe-area';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/design-tokens';
import { MOCK_DRIVERS, getOnDutyDrivers, getOffDutyDrivers } from '@/data/drivers';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Driver } from '@/types/driver';

type FilterType = 'all' | 'on_duty' | 'off_duty';

export default function DriversScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('all');

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );
  const tintColor = useThemeColor({}, 'tint');

  const getFilteredDrivers = (): Driver[] => {
    switch (filter) {
      case 'on_duty':
        return getOnDutyDrivers();
      case 'off_duty':
        return getOffDutyDrivers();
      default:
        return MOCK_DRIVERS;
    }
  };

  const drivers = getFilteredDrivers();

  const calculatedPaddingTop = getHeaderTopPadding(insets, 16);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DriverCard driver={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: calculatedPaddingTop },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>Available Drivers</ThemedText>
            <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
              Browse and contact drivers
            </ThemedText>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
              <Pressable
                style={[
                  styles.filterPill,
                  filter === 'all' && {
                    backgroundColor: tintColor,
                  },
                ]}
                onPress={() => setFilter('all')}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    filter === 'all' && styles.filterTextActive,
                  ]}
                >
                  All ({MOCK_DRIVERS.length})
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.filterPill,
                  filter === 'on_duty' && {
                    backgroundColor: tintColor,
                  },
                ]}
                onPress={() => setFilter('on_duty')}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    filter === 'on_duty' && styles.filterTextActive,
                  ]}
                >
                  On Duty ({getOnDutyDrivers().length})
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.filterPill,
                  filter === 'off_duty' && {
                    backgroundColor: tintColor,
                  },
                ]}
                onPress={() => setFilter('off_duty')}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    filter === 'off_duty' && styles.filterTextActive,
                  ]}
                >
                  Off Duty ({getOffDutyDrivers().length})
                </ThemedText>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
              No drivers found
            </ThemedText>
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(140, 147, 144, 0.2)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
