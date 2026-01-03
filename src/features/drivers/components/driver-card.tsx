import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/src/ui/components/themed-text';
import { BorderRadius, Spacing } from '@/src/constants/design-tokens';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import type { Driver } from '@/src/types/driver';

type DriverCardProps = {
  driver: Driver;
};

// Map vehicle types to seat counts
const VEHICLE_SEATS: Record<string, number> = {
  Sedan: 4,
  SUV: 6,
  Van: 8,
};

export function DriverCard({ driver }: DriverCardProps) {
  const router = useRouter();

  // Avatar sizing follows LDSG Avatar L (60px)
  const AVATAR_SIZE = 60;
  const AVATAR_RADIUS = AVATAR_SIZE / 2;

  const cardBackgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#8B8F95' },
    'textSecondary'
  );
  const borderColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );
  const pressedBackgroundColor = useThemeColor(
    { light: '#F5F5F5', dark: '#1F1F1F' },
    'surfacePressed'
  );
  const avatarBackgroundColor = useThemeColor(
    { light: '#EEF0F2', dark: '#1D1F24' },
    'surface'
  );
  const onDutyColor = '#00BE3C';

  const handlePress = () => {
    router.push(`/driver/${driver.id}`);
  };

  const seatCount = VEHICLE_SEATS[driver.vehicleType] || 4;
  const avatarSource = driver.profileImage
    ? { uri: driver.profileImage }
    : { uri: `https://api.dicebear.com/7.x/thumbs/png?seed=${encodeURIComponent(driver.id)}` };
  const initials =
    driver.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? pressedBackgroundColor : cardBackgroundColor,
          borderColor,
        },
      ]}
      onPress={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${driver.name}, ${driver.rating} stars, ${driver.reviewCount} trips, ${driver.vehicleType}, ${seatCount} seats, ${driver.onDuty ? 'on duty' : 'off duty'}`}
    >
      {/* Top Section: Avatar + Driver Info */}
      <View style={styles.topSection}>
        {/* Avatar with Status Dot */}
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              {
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_RADIUS,
                backgroundColor: avatarBackgroundColor,
                borderColor,
              },
            ]}
          >
            {driver.profileImage ? (
              <Image
                source={avatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <ThemedText style={[styles.avatarInitials, { color: secondaryTextColor }]}>
                {initials}
              </ThemedText>
            )}
          </View>
          {driver.onDuty && (
            <View style={[styles.statusDot, { backgroundColor: onDutyColor }]} />
          )}
        </View>

        {/* Driver Info */}
        <View style={styles.info}>
          {/* Name - wraps to 2 lines */}
          <ThemedText style={styles.name} numberOfLines={2}>
            {driver.name}
          </ThemedText>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <ThemedText style={styles.rating}>
              {driver.rating.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.separator, { color: secondaryTextColor }]}>
              •
            </ThemedText>
            <ThemedText style={[styles.tripCount, { color: secondaryTextColor }]}>
              {driver.reviewCount} trips
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* Vehicle Info Row */}
      <View style={styles.vehicleRow}>
        <Ionicons name="car-outline" size={16} color={secondaryTextColor} />
        <ThemedText style={[styles.vehicleText, { color: secondaryTextColor }]}>
          {driver.vehicleType} • {seatCount} seats
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  topSection: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  tripCount: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleText: {
    fontSize: 14,
  },
});

