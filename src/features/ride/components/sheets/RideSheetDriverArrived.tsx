import React from 'react';
import { StyleSheet, View, Alert, Linking } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
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
 * RideSheetDriverArrived - Content for DRIVER_ARRIVED state
 *
 * Server state: arrived
 * Driver has arrived at pickup location
 * Shows QR code for driver to scan to start the ride
 * Next: Driver scans QR → ACTIVE
 */
export function RideSheetDriverArrived({ animatedIndex, currentIndex }: Props) {
  const data = useRideSheetStore((s) => s.data);
  const cancel = useRideSheetStore((s) => s.cancel);

  // Expanded content fade
  const expandedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 1],
      [0.5, 1],
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
      'Your driver has arrived. Are you sure you want to cancel?',
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
        <View style={styles.arrivedBadge}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.arrivedText}>Driver Arrived</Text>
        </View>

        <Text style={styles.statusTitle}>
          {data.driverName || 'Your driver'} is here!
        </Text>

        <Text variant="caption" style={styles.statusSubtitle}>
          Show this QR code to start your ride
        </Text>
      </View>

      {/* Peek/Expanded content */}
      {!isCollapsed && (
        <Animated.View style={[styles.expandedContent, expandedStyle]}>
          {/* QR Code */}
          <View style={styles.qrContainer}>
            {data.qrTokenJti ? (
              <QRCode
                value={data.qrTokenJti}
                size={180}
                backgroundColor="white"
                color="black"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={80} color={colors.textMuted} />
                <Text variant="caption" style={styles.qrError}>
                  QR code unavailable
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.qrInstruction}>
            Let driver scan to verify
          </Text>

          {/* Driver info mini card */}
          <View style={styles.driverMiniCard}>
            <View style={styles.driverMiniAvatar}>
              <Text style={styles.driverMiniInitial}>
                {(data.driverName || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverMiniInfo}>
              <Text style={styles.driverMiniName}>{data.driverName || 'Driver'}</Text>
              {data.vehicleInfo && (
                <Text variant="caption" style={styles.driverMiniVehicle}>
                  {data.vehicleInfo}
                </Text>
              )}
            </View>
            {data.finalFareAmount && (
              <Text style={styles.fareMini}>
                {formatPrice(data.finalFareAmount)}
              </Text>
            )}
            <Pressable onPress={handleCallDriver} style={styles.callButtonMini}>
              <Ionicons name="call" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {/* Help text */}
          <View style={styles.helpSection}>
            <Ionicons name="information-circle" size={18} color={colors.textSecondary} />
            <Text variant="caption" style={styles.helpText}>
              If you can't find your driver, look for {data.vehicleInfo || 'their vehicle'}.
              {data.vehicleLicensePlate && ` License plate: ${data.vehicleLicensePlate}`}
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
  arrivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.successMuted,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.pill,
  },
  arrivedText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    marginTop: space[3],
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[5],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  qrError: {
    color: colors.textMuted,
    marginTop: space[2],
  },
  qrInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: space[3],
  },
  driverMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space[4],
  },
  driverMiniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMiniInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  driverMiniInfo: {
    flex: 1,
    marginLeft: space[3],
  },
  driverMiniName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  driverMiniVehicle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  fareMini: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: space[2],
  },
  callButtonMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    padding: space[3],
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    marginTop: space[3],
  },
  helpText: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 18,
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
