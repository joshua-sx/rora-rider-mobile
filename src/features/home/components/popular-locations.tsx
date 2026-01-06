import { StyleSheet, View, FlatList, Pressable } from 'react-native';

import { ThemedText } from '@/src/ui/components/themed-text';
import {
  PopularLocationCard,
  PopularLocation,
} from '@/src/ui/legacy/popular-location-card';
import { useThemeColor } from '@/src/hooks/use-theme-color';

// Sample popular locations data - using placeholder images
const POPULAR_LOCATIONS: PopularLocation[] = [
  {
    id: '1',
    name: 'Sonesta Resort',
    image: '',
    description: 'Beachfront luxury resort',
  },
  {
    id: '2',
    name: 'Mullet Bay',
    image: '',
    description: 'Crystal clear water',
  },
  {
    id: '3',
    name: 'Lotus Nightclub',
    image: '',
    description: 'Premier nightlife venue',
  },
  {
    id: '4',
    name: 'Princess Juliana Airport',
    image: '',
    description: 'Famous plane spotting',
  },
  {
    id: '5',
    name: 'Maho Beach',
    image: '',
    description: 'Watch planes land overhead',
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
