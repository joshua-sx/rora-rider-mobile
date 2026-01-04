import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DriverCard } from '@/src/features/drivers/components/driver-card';
import { Text, Box, space } from '@/src/ui';
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
    <Box style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <View style={styles.stickyHeader}>
        <Text style={styles.title}>Available Drivers</Text>
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          Browse and contact drivers
        </Text>

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
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              All ({MOCK_DRIVERS.length})
            </Text>
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
            <Text
              style={[
                styles.filterText,
                filter === 'on_duty' && styles.filterTextActive,
              ]}
            >
              On Duty ({getOnDutyDrivers().length})
            </Text>
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
            <Text
              style={[
                styles.filterText,
                filter === 'off_duty' && styles.filterTextActive,
              ]}
            >
              Off Duty ({getOffDutyDrivers().length})
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DriverCard driver={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + space[4] },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No drivers found
            </Text>
          </View>
        }
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: space[4],
    paddingTop: space[3],
  },
  stickyHeader: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(140, 147, 144, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: space[1],
  },
  subtitle: {
    fontSize: 16,
    marginBottom: space[4],
  },
  filterContainer: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[3],
  },
  filterPill: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
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
    paddingVertical: space[6],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
