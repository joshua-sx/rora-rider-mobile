import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/design-tokens';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Driver } from '@/types/driver';

type DriverCardProps = {
  driver: Driver;
};

export function DriverCard({ driver }: DriverCardProps) {
  const router = useRouter();
  
  const cardBackgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const textColor = useThemeColor({ light: '#262626', dark: '#E5E7EA' }, 'text');
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#8B8F95' },
    'textSecondary'
  );
  const borderColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );
  const onDutyColor = '#00BE3C';
  const offDutyColor = '#8C9390';

  const handlePress = () => {
    router.push(`/driver/${driver.id}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBackgroundColor, borderColor },
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`View ${driver.name}'s profile`}
    >
      {/* Profile Image Placeholder */}
      <View style={[styles.profileImage, { backgroundColor: borderColor }]}>
        <Ionicons name="person" size={32} color={secondaryTextColor} />
      </View>

      {/* Driver Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.name}>{driver.name}</ThemedText>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: driver.onDuty
                  ? `${onDutyColor}20`
                  : `${offDutyColor}20`,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: driver.onDuty ? onDutyColor : offDutyColor,
                },
              ]}
            />
            <ThemedText
              style={[
                styles.statusText,
                { color: driver.onDuty ? onDutyColor : offDutyColor },
              ]}
            >
              {driver.onDuty ? 'On Duty' : 'Off Duty'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#FFB800" />
          <ThemedText style={styles.rating}>
            {driver.rating.toFixed(1)}
          </ThemedText>
          <ThemedText style={[styles.reviewCount, { color: secondaryTextColor }]}>
            ({driver.reviewCount} reviews)
          </ThemedText>
        </View>

        <View style={styles.vehicleRow}>
          <Ionicons name="car-outline" size={16} color={secondaryTextColor} />
          <ThemedText style={[styles.vehicleText, { color: secondaryTextColor }]}>
            {driver.vehicleType} • {driver.vehicleModel}
          </ThemedText>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
  reviewCount: {
    fontSize: 13,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleText: {
    fontSize: 13,
  },
});

