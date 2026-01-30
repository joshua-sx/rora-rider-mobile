import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Linking } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Button } from '@/src/ui/components/Button';
import { RouteHeader } from '../shared/RouteHeader';
import { useRideSheetStore } from '../../store/ride-sheet-store';
import { formatPrice } from '@/src/utils/pricing';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';

type Props = {
  /** Animated sheet index for content transitions */
  animatedIndex: SharedValue<number>;
  /** Current snap point index */
  currentIndex: number;
};

/**
 * RideSheetDriverConfirmed - Content for DRIVER_CONFIRMED state
 *
 * Server state: confirmed
 * Driver has confirmed and is on the way to pickup
 * Next: Driver arrives → DRIVER_ARRIVED
 */
export function RideSheetDriverConfirmed({ animatedIndex, currentIndex }: Props) {
  const data = useRideSheetStore((s) => s.data);
  const cancel = useRideSheetStore((s) => s.cancel);

  const [etaMinutes, setEtaMinutes] = useState(data.driverEta || 5);

  // Countdown ETA (simulated - in production this would come from driver location updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setEtaMinutes((prev) => Math.max(0, prev - 1));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Expanded content fade
  const expandedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [0, 0.5, 1],
      'clamp'
    );
    return { opacity };
  }, []);

  const handleCallDriver = () => {
    if (data.driverPhone) {
      Linking.openURL(`tel:${data.driverPhone}`);
    } else {
      Alert.alert('Contact Unavailable', 'Driver contact information is not available.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride?',
      'Your driver is already on the way. Are you sure you want to cancel?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancel(),
        },
      ]
    );
  };

  const isCollapsed = currentIndex === 0;

  return (
    <View style={styles.container}>
      {/* Status section (always visible) */}
      <View style={styles.statusSection}>
        <View style={styles.etaBadge}>
          <Ionicons name="car" size={24} color={colors.primary} />
          <Text style={styles.etaText}>
            {etaMinutes > 0 ? `${etaMinutes} min away` : 'Arriving now'}
          </Text>
        </View>

        <Text style={styles.statusTitle}>
          {data.driverName || 'Driver'} is on the way
        </Text>

        <Text variant="caption" style={styles.statusSubtitle}>
          Get ready at your pickup location
        </Text>
      </View>

      {/* Peek/Expanded content */}
      {!isCollapsed && (
        <Animated.View style={[styles.expandedContent, expandedStyle]}>
          {/* Driver info card */}
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>
                {(data.driverName || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{data.driverName || 'Driver'}</Text>
              {data.vehicleInfo && (
                <Text variant="caption" style={styles.vehicleText}>
                  {data.vehicleInfo}
                </Text>
              )}
              {data.vehicleLicensePlate && (
                <View style={styles.licensePlate}>
                  <Text style={styles.licensePlateText}>
                    {data.vehicleLicensePlate}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.driverActions}>
              {data.driverRating && (
                <Text style={styles.ratingText}>
                  ★ {data.driverRating.toFixed(1)}
                </Text>
              )}
              <Pressable onPress={handleCallDriver} style={styles.callButton}>
                <Ionicons name="call" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Route summary */}
          {data.origin && data.destination && (
            <View style={styles.routeSummary}>
              <RouteHeader
                originLabel={data.origin.name}
                destinationLabel={data.destination.name}
                compact
              />
              {data.finalFareAmount && (
                <Text style={styles.fareText}>
                  {formatPrice(data.finalFareAmount)}
                </Text>
              )}
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text variant="caption" style={styles.tipsTitle}>
              Tips for pickup
            </Text>
            <View style={styles.tipItem}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text variant="caption" style={styles.tipText}>
                Be at your pickup location
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="eye" size={16} color={colors.textSecondary} />
              <Text variant="caption" style={styles.tipText}>
                Look for {data.vehicleInfo || "your driver's vehicle"}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="qr-code" size={16} color={colors.textSecondary} />
              <Text variant="caption" style={styles.tipText}>
                Have your QR code ready to show
              </Text>
            </View>
          </View>

          {/* Cancel link */}
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel ride</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: space[4],
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.pill,
  },
  etaText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: space[4],
    textAlign: 'center',
  },
  statusSubtitle: {
    color: colors.textSecondary,
    marginTop: space[2],
    textAlign: 'center',
  },
  expandedContent: {
    flex: 1,
    marginTop: space[4],
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  driverInfo: {
    flex: 1,
    marginLeft: space[3],
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  vehicleText: {
    color: colors.textSecondary,
    marginTop: space[1],
  },
  licensePlate: {
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: space[2],
  },
  licensePlateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 1,
  },
  driverActions: {
    alignItems: 'flex-end',
    gap: space[2],
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space[3],
  },
  fareText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  tipsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    marginTop: space[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: space[3],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[2],
  },
  tipText: {
    color: colors.textSecondary,
    flex: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: space[4],
    marginTop: 'auto',
  },
  cancelButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
