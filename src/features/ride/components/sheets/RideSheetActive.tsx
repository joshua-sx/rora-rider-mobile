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
import { RouteHeader } from '../shared/RouteHeader';
import { useRideSheetStore } from '../../store/ride-sheet-store';
import { formatPrice, formatDuration } from '@/src/utils/pricing';
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
 * RideSheetActive - Content for ACTIVE state
 *
 * Server state: active
 * Ride is in progress
 * Shows ride progress, driver info, and ETA to destination
 * Next: Driver completes → COMPLETED
 */
export function RideSheetActive({ animatedIndex, currentIndex }: Props) {
  const data = useRideSheetStore((s) => s.data);

  // Calculate elapsed time since ride started
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!data.startedAt) return;

    const calculateElapsed = () => {
      const started = new Date(data.startedAt!).getTime();
      const now = Date.now();
      return Math.floor((now - started) / 60000);
    };

    setElapsedMinutes(calculateElapsed());

    const interval = setInterval(() => {
      setElapsedMinutes(calculateElapsed());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data.startedAt]);

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

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Contact',
      'Do you need emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency Services',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:911'),
        },
        {
          text: 'Contact Support',
          onPress: () => {
            // Would open support chat or call support number
            Alert.alert('Support', 'Support feature coming soon');
          },
        },
      ]
    );
  };

  const isCollapsed = currentIndex === 0;

  // Estimated remaining time (from route data)
  const estimatedDuration = data.routeData?.duration || 0;
  const remainingMinutes = Math.max(0, estimatedDuration - elapsedMinutes);

  return (
    <View style={styles.container}>
      {/* Status section (always visible) */}
      <View style={styles.statusSection}>
        <View style={styles.activeBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeText}>Ride in Progress</Text>
        </View>

        <Text style={styles.statusTitle}>
          On the way to destination
        </Text>

        <View style={styles.etaRow}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text variant="caption" style={styles.etaText}>
            {remainingMinutes > 0
              ? `~${remainingMinutes} min remaining`
              : 'Arriving soon'}
          </Text>
        </View>
      </View>

      {/* Peek/Expanded content */}
      {!isCollapsed && (
        <Animated.View style={[styles.expandedContent, expandedStyle]}>
          {/* Ride progress card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text variant="caption" style={styles.progressLabel}>Ride Time</Text>
              <Text style={styles.progressValue}>
                {elapsedMinutes} min
              </Text>
            </View>
            {data.finalFareAmount && (
              <View style={styles.progressHeader}>
                <Text variant="caption" style={styles.progressLabel}>Fare</Text>
                <Text style={styles.progressValue}>
                  {formatPrice(data.finalFareAmount)}
                </Text>
              </View>
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

          {/* Driver mini card */}
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
            <Pressable onPress={handleCallDriver} style={styles.callButtonMini}>
              <Ionicons name="call" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {/* Safety section */}
          <View style={styles.safetySection}>
            <Pressable onPress={handleEmergency} style={styles.emergencyButton}>
              <Ionicons name="shield-outline" size={20} color={colors.danger} />
              <Text style={styles.emergencyText}>Emergency</Text>
            </Pressable>
            <Text variant="caption" style={styles.safetyText}>
              Share your trip status with friends and family
            </Text>
          </View>

          {/* Info text */}
          <View style={styles.infoSection}>
            <Text variant="caption" style={styles.infoText}>
              Sit back and enjoy your ride! Your driver will mark the ride as complete
              when you reach your destination.
            </Text>
          </View>
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
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.pill,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  activeText: {
    fontSize: 14,
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
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[2],
  },
  etaText: {
    color: colors.textSecondary,
  },
  expandedContent: {
    flex: 1,
    marginTop: space[4],
  },
  progressCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    alignItems: 'center',
  },
  progressLabel: {
    color: colors.textSecondary,
    marginBottom: space[1],
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
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
  driverMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space[3],
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
  callButtonMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space[3],
    gap: space[3],
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  safetyText: {
    flex: 1,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    padding: space[4],
    marginTop: space[3],
  },
  infoText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
