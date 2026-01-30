import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { RouteHeader } from '../shared/RouteHeader';
import { useRideSheetStore } from '../../store/ride-sheet-store';
import { formatPrice } from '@/src/utils/pricing';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';

const HOLD_TIMEOUT_SECONDS = 60;

type Props = {
  /** Animated sheet index for content transitions */
  animatedIndex: SharedValue<number>;
  /** Current snap point index */
  currentIndex: number;
};

/**
 * RideSheetHold - Content for MATCHED state (rider selected offer, waiting for driver confirmation)
 *
 * Server state: hold
 * Next: Driver confirms → DRIVER_CONFIRMED, or timeout → back to OFFERS_RECEIVED
 */
export function RideSheetHold({ animatedIndex, currentIndex }: Props) {
  const data = useRideSheetStore((s) => s.data);
  const cancel = useRideSheetStore((s) => s.cancel);

  const [countdown, setCountdown] = useState(HOLD_TIMEOUT_SECONDS);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

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

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel? The driver is reviewing your request.',
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
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.statusTitle}>
          Waiting for driver confirmation
        </Text>

        <Text variant="caption" style={styles.statusSubtitle}>
          {data.driverName || 'Driver'} is reviewing your request
        </Text>

        {countdown > 0 && (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
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
              {data.driverRating && (
                <Text variant="caption" style={styles.ratingText}>
                  ★ {data.driverRating.toFixed(1)}
                </Text>
              )}
            </View>
            {data.finalFareAmount && (
              <Text style={styles.fareAmount}>
                {formatPrice(data.finalFareAmount)}
              </Text>
            )}
          </View>

          {/* Route summary */}
          {data.origin && data.destination && (
            <View style={styles.routeSummary}>
              <RouteHeader
                originLabel={data.origin.name}
                destinationLabel={data.destination.name}
                compact
              />
            </View>
          )}

          {/* Info text */}
          <View style={styles.infoSection}>
            <Text variant="caption" style={styles.infoText}>
              The driver has {HOLD_TIMEOUT_SECONDS} seconds to confirm your ride request.
              If they don't respond, you'll be returned to the offers list.
            </Text>
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
  countdownBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    borderRadius: radius.pill,
    marginTop: space[3],
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  driverInfo: {
    flex: 1,
    marginLeft: space[3],
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vehicleText: {
    color: colors.textSecondary,
    marginTop: space[1],
  },
  ratingText: {
    color: colors.warning,
    marginTop: space[1],
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  routeSummary: {
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space[3],
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    marginTop: space[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
