import React from 'react';
import { StyleSheet, View, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Button } from '@/src/ui/components/Button';
import { ProBadge } from '@/src/ui/components/ProBadge';
import { VerifiedBadge } from '@/src/ui/components/VerifiedBadge';
import { PriceLabel } from '@/src/ui/components/PriceLabel';
import { useRideSheetStore } from '../../store/ride-sheet-store';
import { formatPrice } from '@/src/utils/pricing';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';
import { DEFAULT_BLURHASH, IMAGE_TRANSITION_DURATION } from '@/src/ui/tokens/images';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * RideSheetConfirm - Modal overlay for CONFIRMING state
 *
 * Shows:
 * - Scrim overlay blocking the map
 * - Driver detail card with photo, name, badges
 * - Price with label
 * - Destination reminder
 * - "Confirm Ride" CTA
 * - "Choose different driver" secondary action
 */
export function RideSheetConfirm() {
  const insets = useSafeAreaInsets();
  const data = useRideSheetStore((s) => s.data);
  const confirmRide = useRideSheetStore((s) => s.confirmRide);
  const backToOffers = useRideSheetStore((s) => s.backToOffers);

  const offer = data.selectedOffer;

  if (!offer) return null;

  const handleConfirm = async () => {
    await confirmRide();
  };

  const handleBack = () => {
    backToOffers();
  };

  const getPriceLabel = (): 'good-deal' | 'pricier' | null => {
    if (!offer.offered_amount || !data.fareAmount) return null;

    const percentDiff =
      ((offer.offered_amount - data.fareAmount) / data.fareAmount) * 100;

    if (percentDiff <= -20) {
      return 'good-deal';
    } else if (percentDiff >= 30) {
      return 'pricier';
    }
    return null;
  };

  const priceLabel = getPriceLabel();

  // Helper to get driver info from profile
  const driverName = offer.driver_profile?.display_name || 'Driver';
  const driverPhoto = offer.driver_profile?.avatar_url;
  const vehicleInfo = [
    offer.driver_profile?.vehicle_make,
    offer.driver_profile?.vehicle_model,
  ].filter(Boolean).join(' ') || offer.driver_profile?.vehicle_type || 'Vehicle';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBack}
    >
      {/* Scrim overlay */}
      <Pressable style={styles.overlay} onPress={handleBack}>
        <View />
      </Pressable>

      {/* Content card */}
      <View
        style={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, space[6]),
          },
        ]}
      >
        <Text style={styles.title}>Confirm Your Driver</Text>

        {/* Driver card */}
        <View style={styles.driverCard}>
          {/* Photo */}
          <View style={styles.photoContainer}>
            {driverPhoto ? (
              <Image
                source={{ uri: driverPhoto }}
                style={styles.photo}
                placeholder={{ blurhash: DEFAULT_BLURHASH }}
                transition={IMAGE_TRANSITION_DURATION}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoInitial}>
                  {driverName.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>

          {/* Driver info */}
          <Text style={styles.driverName}>{driverName}</Text>

          {/* Badges - TODO: Add verification/pro status to driver_profile */}
          <View style={styles.badgesRow}>
            {/* Badges will be shown when driver_profile has these fields */}
          </View>

          {/* Vehicle info */}
          <Text variant="caption" style={styles.vehicleInfo}>
            {vehicleInfo}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Price */}
          <Text style={styles.price}>
            {formatPrice(offer.offered_amount ?? 0)}
          </Text>

          {/* Price label */}
          {priceLabel && (
            <View style={styles.priceLabelContainer}>
              <PriceLabel variant={priceLabel} />
            </View>
          )}
        </View>

        {/* Destination reminder */}
        {data.destination && (
          <View style={styles.destinationRow}>
            <Text variant="caption" style={styles.destinationLabel}>
              To:
            </Text>
            <Text variant="body" numberOfLines={1} style={styles.destinationText}>
              {data.destination.name}
            </Text>
          </View>
        )}

        {/* CTA section */}
        <View style={styles.ctaSection}>
          <Button
            label="Confirm Ride"
            onPress={handleConfirm}
            loading={data.isConfirmingRide}
          />
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Choose different driver</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space[5],
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: space[5],
  },
  driverCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[5],
    alignItems: 'center',
  },
  photoContainer: {
    marginBottom: space[3],
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  photoPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryText,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[2],
  },
  vehicleInfo: {
    color: colors.textSecondary,
    marginTop: space[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
    marginVertical: space[4],
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  priceLabelContainer: {
    marginTop: space[2],
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[4],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destinationLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  destinationText: {
    flex: 1,
    color: colors.text,
  },
  ctaSection: {
    gap: space[3],
    marginTop: space[5],
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: space[3],
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
