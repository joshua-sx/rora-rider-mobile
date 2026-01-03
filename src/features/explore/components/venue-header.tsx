import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/src/ui/components/themed-text';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import type { Venue } from '@/src/types/venue';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

type VenueHeaderProps = {
  venue: Venue;
  onSavePress?: () => void;
  isSaved?: boolean;
};

export function VenueHeader({
  venue,
  onSavePress,
  isSaved = false,
}: VenueHeaderProps) {
  const router = useRouter();
  const backgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#0E0F0F' },
    'surface'
  );
  const textColor = useThemeColor(
    { light: '#262626', dark: '#E5E7EA' },
    'text'
  );
  const subtextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );
  const chipBackgroundColor = useThemeColor(
    { light: '#EEF3ED', dark: '#1F1F1F' },
    'background'
  );
  const starColor = '#FBBF24';

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: venue.images[0] }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          transition={300}
        />
        
        {/* Overlay Buttons */}
        <View style={styles.overlayButtons}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={onSavePress}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={24}
              color={isSaved ? '#EF4444' : '#FFFFFF'}
            />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor }]}>
        <View style={styles.titleRow}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            {venue.name}
          </ThemedText>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={starColor} />
            <ThemedText style={[styles.rating, { color: textColor }]}>
              {venue.rating}
            </ThemedText>
          </View>
          <ThemedText style={[styles.metaText, { color: subtextColor }]}>
            {venue.reviewCount} reviews
          </ThemedText>
          <ThemedText style={[styles.metaDot, { color: subtextColor }]}>·</ThemedText>
          <ThemedText style={[styles.metaText, { color: subtextColor }]}>
            {venue.category.charAt(0).toUpperCase() + venue.category.slice(1)}
          </ThemedText>
        </View>

        {venue.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {venue.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: chipBackgroundColor }]}
              >
                <ThemedText style={[styles.tagText, { color: subtextColor }]}>
                  {tag}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  titleRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  rating: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  metaText: {
    fontSize: 14,
  },
  metaDot: {
    fontSize: 14,
    marginHorizontal: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
