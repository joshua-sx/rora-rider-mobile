import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/src/ui/components/themed-text';
import { IMAGE_TRANSITION_DURATION } from '@/src/ui/tokens/images';
import { BorderRadius, Spacing } from '@/src/constants/design-tokens';
import { useThemeColor } from '@/src/hooks/use-theme-color';

/**
 * GridCard - Reusable Airbnb-style card for grid layouts
 *
 * Used for:
 * - Driver cards (person icon placeholder)
 * - Location cards (location icon placeholder)
 * - Any 2-column grid content
 */

type GridCardProps = {
  /** Card title (displayed bold) */
  title: string;
  /** Optional subtitle line */
  subtitle?: string;
  /** Optional tertiary text line */
  tertiaryText?: string;
  /** Image URL - shows placeholder if empty */
  imageUrl?: string;
  /** Icon to show in placeholder ('person' | 'location') */
  placeholderIcon?: 'person' | 'location';
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Additional container styles */
  style?: ViewStyle;
};

export function GridCard({
  title,
  subtitle,
  tertiaryText,
  imageUrl,
  placeholderIcon = 'location',
  onPress,
  style,
}: GridCardProps) {
  const placeholderColor = useThemeColor(
    { light: '#E8E8E8', dark: '#2A2A2A' },
    'background',
  );
  const secondaryTextColor = useThemeColor(
    { light: '#717171', dark: '#8B8F95' },
    'textSecondary',
  );

  const hasImage = !!imageUrl;
  const iconName = placeholderIcon === 'person' ? 'person' : 'location';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Image */}
      <View style={[styles.imageContainer, { backgroundColor: placeholderColor }]}>
        {hasImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={IMAGE_TRANSITION_DURATION}
          />
        ) : (
          <View style={styles.placeholderIcon}>
            <Ionicons name={iconName} size={40} color="#BDBDBD" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>

        {subtitle && (
          <ThemedText
            style={[styles.subtitle, { color: secondaryTextColor }]}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        )}

        {tertiaryText && (
          <ThemedText
            style={[styles.tertiaryText, { color: secondaryTextColor }]}
            numberOfLines={1}
          >
            {tertiaryText}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  image: {
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
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 2,
  },
  tertiaryText: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
  },
});
