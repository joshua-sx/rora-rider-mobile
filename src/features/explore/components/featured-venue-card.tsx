import { StyleSheet, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/src/ui';
import type { Venue } from '@/src/types/venue';

type FeaturedVenueCardProps = {
  venue: Venue;
  onPress?: (venue: Venue) => void;
  size?: 'large' | 'medium';
};

export function FeaturedVenueCard({
  venue,
  onPress,
  size = 'large',
}: FeaturedVenueCardProps) {
  const isLarge = size === 'large';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isLarge ? styles.containerLarge : styles.containerMedium,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress?.(venue)}
    >
      <Image
        source={{ uri: venue.images[0] }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />
      
      {venue.isPopular && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>POPULAR</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{venue.name}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {venue.shortDescription}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  containerLarge: {
    height: 200,
    width: '100%',
  },
  containerMedium: {
    height: 160,
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00BE3C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
