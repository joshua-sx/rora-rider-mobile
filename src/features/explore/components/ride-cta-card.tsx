import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/src/ui/components/themed-text';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { useStickyCta } from '@/src/hooks/use-sticky-cta';
import type { Venue } from '@/src/types/venue';

type RideCtaCardProps = {
  venue: Venue;
  onPress?: () => void;
};

/**
 * Approximate card height calculation:
 * - paddingTop: 16
 * - title lineHeight: ~22 + marginBottom: 4 = 26
 * - metaRow: ~20
 * - content marginBottom: 14
 * - button: ~48 (paddingVertical 32 + content)
 * - paddingBottom: 16
 * Total: ~140px
 */
export const RIDE_CTA_CARD_HEIGHT = 140;

export function RideCtaCard({ venue, onPress }: RideCtaCardProps) {
  const { cardBottomPosition } = useStickyCta(RIDE_CTA_CARD_HEIGHT);

  const backgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const textColor = useThemeColor(
    { light: '#262626', dark: '#E5E7EA' },
    'text'
  );
  const subtextColor = useThemeColor(
    { light: '#5C5F62', dark: '#8B8F95' },
    'textSecondary'
  );
  const primaryColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor, bottom: cardBottomPosition }]}>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          Get a ride to {venue.name}
        </ThemedText>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={subtextColor} />
          <ThemedText style={[styles.metaText, { color: subtextColor }]}>
            Est. trip: {venue.estimatedDuration || 12} min
          </ThemedText>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: primaryColor },
          pressed && styles.buttonPressed,
        ]}
        onPress={onPress}
      >
        <ThemedText style={styles.buttonText}>View route & pricing</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
