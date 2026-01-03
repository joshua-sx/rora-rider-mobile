import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriverCard } from '@/src/features/drivers/components/driver-card';
import { ThemedText } from '@/src/ui/components/themed-text';
import { ThemedView } from '@/src/ui/components/themed-view';
import { Spacing } from '@/src/constants/design-tokens';
import { MOCK_DRIVERS, getOnDutyDrivers, getOffDutyDrivers } from '@/src/features/drivers/data/drivers';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import type { Driver } from '@/src/types/driver';
import { getTabBarHeight } from '@/src/utils/safe-area';

type FilterType = 'all' | 'on_duty' | 'off_duty';

export default function DriversScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);
  const [filter, setFilter] = useState<FilterType>('all');
  // ...

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

  return (
    <ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <View style={styles.stickyHeader}>
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

      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DriverCard driver={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.lg },
        ]}
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
    paddingTop: Spacing.md,
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
