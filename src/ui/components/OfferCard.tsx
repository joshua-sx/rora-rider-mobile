import { StyleSheet, View, type ViewStyle, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';

import { formatPrice } from '@/src/utils/pricing';
import { Text } from '../primitives/Text';
import { DEFAULT_BLURHASH, IMAGE_TRANSITION_DURATION } from '../tokens/images';
import { Pressable } from '../primitives/Pressable';
import { Button } from './Button';
import { ProBadge } from './ProBadge';
import { VerifiedBadge } from './VerifiedBadge';
import { PriceLabel } from './PriceLabel';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { space } from '../tokens/spacing';
import { type } from '../tokens/typography';

/**
 * OfferCard
 *
 * Displays a driver's offer during the discovery phase.
 * Shows driver info, price, and vehicle details.
 *
 * Layout:
 * - Row 1: Photo | Name + badges | Price
 * - Row 2: Price label (if applicable)
 * - Row 3: Distance | Vehicle info
 * - Row 4: Select button
 */

type PriceLabelVariant = 'good-deal' | 'pricier' | null;

type Props = {
  /** Driver's display name */
  driverName: string;
  /** Driver's photo source */
  driverPhoto?: ImageSourcePropType;
  /** Whether the driver is verified */
  isVerified?: boolean;
  /** Whether the driver has Pro status */
  isPro?: boolean;
  /** Offered price in XCD */
  price: number;
  /** Price context label */
  priceLabel?: PriceLabelVariant;
  /** Distance from pickup location */
  distanceText: string;
  /** Vehicle description (e.g., "Toyota Camry • 4 seats") */
  vehicleInfo: string;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Callback when select button is pressed */
  onSelect: () => void;
  /** Whether the select action is loading */
  isSelecting?: boolean;
  /** Additional styles */
  style?: ViewStyle;
};

export function OfferCard({
  driverName,
  driverPhoto,
  isVerified = false,
  isPro = false,
  price,
  priceLabel,
  distanceText,
  vehicleInfo,
  onPress,
  onSelect,
  isSelecting = false,
  style,
}: Props) {
  const cardContent = (
    <View style={[styles.container, style]}>
      {/* Row 1: Driver info + Price */}
      <View style={styles.headerRow}>
        {/* Driver Photo */}
        <View style={styles.photoContainer}>
          {driverPhoto ? (
            <Image
              source={driverPhoto}
              style={styles.photo}
              placeholder={{ blurhash: DEFAULT_BLURHASH }}
              transition={IMAGE_TRANSITION_DURATION}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]} />
          )}
        </View>

        {/* Name and Badges */}
        <View style={styles.driverInfo}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driverName}
          </Text>
          <View style={styles.badgesRow}>
            {isPro && <ProBadge style={styles.badge} />}
            {isVerified && <VerifiedBadge style={styles.badge} />}
          </View>
        </View>

        {/* Price */}
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>

      {/* Row 2: Price Label (if applicable) */}
      {priceLabel && (
        <View style={styles.priceLabelRow}>
          <PriceLabel variant={priceLabel} />
        </View>
      )}

      {/* Row 3: Distance + Vehicle */}
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>{distanceText}</Text>
        <Text style={styles.detailSeparator}>•</Text>
        <Text style={styles.detailText} numberOfLines={1}>
          {vehicleInfo}
        </Text>
      </View>

      {/* Row 4: Select Button */}
      <Button
        label="Select this driver"
        variant="secondary"
        onPress={onSelect}
        loading={isSelecting}
        style={styles.selectButton}
      />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photoContainer: {
    marginRight: space[3],
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  photoPlaceholder: {
    backgroundColor: colors.skeleton,
  },
  driverInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: space[3],
  },
  driverName: {
    ...type.headline,
    color: colors.text,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: space[1],
    gap: space[1],
  },
  badge: {
    marginRight: space[1],
  },
  price: {
    ...type.title2,
    color: colors.text,
  },
  priceLabelRow: {
    marginTop: space[3],
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space[3],
  },
  detailText: {
    ...type.bodySmall,
    color: colors.textMuted,
    flexShrink: 1,
  },
  detailSeparator: {
    ...type.bodySmall,
    color: colors.textMuted,
    marginHorizontal: space[2],
  },
  selectButton: {
    marginTop: space[4],
  },
});
