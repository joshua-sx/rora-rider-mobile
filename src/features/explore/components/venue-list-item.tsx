import { StyleSheet, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/ui';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import type { Venue } from '@/src/types/venue';

type VenueListItemProps = {
  venue: Venue;
  onPress?: (venue: Venue) => void;
  showCategory?: boolean;
};

export function VenueListItem({
  venue,
  onPress,
  showCategory = false,
}: VenueListItemProps) {
  const backgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
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
  const starColor = '#FBBF24';
  const primaryColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}
      onPress={() => onPress?.(venue)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: venue.images[0] }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          transition={200}
        />
        {venue.isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: primaryColor }]}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {venue.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={starColor} />
            <Text style={styles.rating}>{venue.rating}</Text>
          </View>
        </View>

        <Text style={[styles.subtext, { color: subtextColor }]} numberOfLines={1}>
          ({venue.reviewCount} reviews) · {venue.shortDescription}
        </Text>

        <View style={styles.footer}>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={14} color={subtextColor} />
            <Text style={[styles.distance, { color: subtextColor }]}>
              {venue.distance} km away
            </Text>
          </View>
          {showCategory && (
            <View style={[styles.categoryBadge, { backgroundColor: primaryColor + '20' }]}>
              <Text style={[styles.categoryText, { color: primaryColor }]}>
                {venue.category.charAt(0).toUpperCase() + venue.category.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 14,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#00BE3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtext: {
    fontSize: 13,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 13,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
