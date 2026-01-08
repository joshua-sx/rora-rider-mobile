import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/src/ui/components/themed-text';
import { IMAGE_TRANSITION_DURATION } from '@/src/ui/tokens/images';
import { BorderRadius, Spacing } from '@/src/constants/design-tokens';
import { VEHICLE_SEATS } from '@/src/constants/vehicle';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import type { Driver } from '@/src/types/driver';

type DriverCardProps = {
  driver: Driver;
};

// Extract first name from full name
function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

// Specialization badge styling
const SPECIALIZATION_BADGES: Record<string, { label: string; icon: string; color: string }> = {
  vip: { label: 'VIP', icon: 'diamond', color: '#FFD700' }, // Gold
  airport: { label: 'Airport', icon: 'airplane', color: '#4A90E2' }, // Blue
  cruise_port: { label: 'Cruise', icon: 'boat', color: '#50C878' }, // Emerald
};

/**
 * DriverCard - Grid card displaying driver info
 * Shows photo, name, rating, vehicle type, and specializations.
 */
export function DriverCard({ driver }: DriverCardProps) {
  const router = useRouter();

  const secondaryTextColor = useThemeColor(
    { light: '#717171', dark: '#8B8F95' },
    'textSecondary'
  );
  const placeholderColor = useThemeColor(
    { light: '#E8E8E8', dark: '#2A2A2A' },
    'background'
  );

  const handlePress = () => {
    router.push(`/driver/${driver.id}`);
  };

  const seatCount = driver.seats || VEHICLE_SEATS[driver.vehicleType] || 4;
  const firstName = getFirstName(driver.name);
  const hasProfileImage = !!driver.profileImage;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${firstName}, ${driver.rating} stars, ${driver.reviewCount} rides, ${driver.vehicleType}, ${seatCount} seats`}
    >
      {/* Photo */}
      <View style={[styles.photoContainer, { backgroundColor: placeholderColor }]}>
        {hasProfileImage ? (
          <Image
            source={{ uri: driver.profileImage }}
            style={styles.photo}
            contentFit="cover"
            transition={IMAGE_TRANSITION_DURATION}
          />
        ) : (
          <View style={styles.placeholderIcon}>
            <Ionicons name="person" size={48} color="#BDBDBD" />
          </View>
        )}
      </View>

      {/* Content - Airbnb style */}
      <View style={styles.content}>
        {/* Title - First name only, bold */}
        <ThemedText style={styles.title} numberOfLines={1}>
          {firstName}
        </ThemedText>

        {/* Vehicle type */}
        <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]} numberOfLines={1}>
          {driver.vehicleType} · {seatCount} seats
        </ThemedText>

        {/* Rating row */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#222222" />
          <ThemedText style={styles.rating}>{driver.rating.toFixed(2)}</ThemedText>
          <ThemedText style={[styles.trips, { color: secondaryTextColor }]}>
            · {driver.reviewCount} ride{driver.reviewCount === 1 ? '' : 's'}
          </ThemedText>
        </View>

        {/* Specialization badges */}
        {driver.specializations && driver.specializations.length > 0 && (
          <View style={styles.badgeRow}>
            {driver.specializations.map((spec) => {
              const badge = SPECIALIZATION_BADGES[spec];
              if (!badge) return null;
              return (
                <View key={spec} style={[styles.badge, { backgroundColor: badge.color }]}>
                  <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={10} color="#FFFFFF" />
                  <ThemedText style={styles.badgeText}>{badge.label}</ThemedText>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
    color: '#222222',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  rating: {
    fontSize: 14,
    fontWeight: '400',
    color: '#222222',
  },
  trips: {
    fontSize: 14,
    fontWeight: '400',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 4,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
