import { StyleSheet, View, FlatList, Pressable } from 'react-native';

import { ThemedText } from '@/src/ui/components/themed-text';
import {
  PopularLocationCard,
  PopularLocation,
} from '@/src/ui/legacy/popular-location-card';
import { useThemeColor } from '@/src/hooks/use-theme-color';

// Sample popular locations data
const POPULAR_LOCATIONS: PopularLocation[] = [
  {
    id: '1',
    name: 'Sonesta Resort',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Mullet Bay',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'Lotus Nightclub',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Princess Juliana Airport',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Maho Beach',
    image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400&h=300&fit=crop',
  },
];

type PopularLocationsProps = {
  onLocationPress?: (location: PopularLocation) => void;
  onSeeMorePress?: () => void;
};

export function PopularLocations({
  onLocationPress,
  onSeeMorePress,
}: PopularLocationsProps) {
  const linkColor = useThemeColor({}, 'link');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>See more</ThemedText>
        <Pressable onPress={onSeeMorePress} hitSlop={8}>
          <ThemedText style={[styles.seeMoreLink, { color: linkColor }]}>
            Explore →
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={POPULAR_LOCATIONS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PopularLocationCard location={item} onPress={onLocationPress} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  seeMoreLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingRight: 24,
  },
});
