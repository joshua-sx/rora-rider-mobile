import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  type SharedValue,
} from 'react-native-reanimated';

import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Button } from '@/src/ui/components/Button';
import { DriverCardSkeleton } from '@/src/ui/components/DriverCardSkeleton';
import { RouteHeader } from '../shared/RouteHeader';
import { useRideSheetStore } from '../../store/ride-sheet-store';
import { formatPrice } from '@/src/utils/pricing';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';

const DISCOVERY_MESSAGES = [
  'Finding drivers near you...',
  'Checking driver availability...',
  'Looking for the best match...',
  'Reaching out to nearby drivers...',
  'Waiting for responses...',
];

const MESSAGE_ROTATION_INTERVAL = 3000; // 3 seconds

type Props = {
  /** Animated sheet index for content transitions */
  animatedIndex: SharedValue<number>;
  /** Current snap point index */
  currentIndex: number;
  /** Callback to show expand search prompt */
  onShowExpandPrompt?: () => void;
};

/**
 * RideSheetDiscovery - Content for DISCOVERING state
 *
 * Snap points:
 * - Collapsed (120px): Spinner + "Finding drivers..." + notified count
 * - Peek (200px): Animated status message + route summary
 * - Expanded (45%): Info text + "Cancel search" link
 */
export function RideSheetDiscovery({
  animatedIndex,
  currentIndex,
  onShowExpandPrompt,
}: Props) {
  const data = useRideSheetStore((s) => s.data);
  const cancel = useRideSheetStore((s) => s.cancel);
  const expandDiscovery = useRideSheetStore((s) => s.expandDiscovery);

  const [messageIndex, setMessageIndex] = useState(0);
  const [showExpandPrompt, setShowExpandPrompt] = useState(false);
  const messageOpacity = useSharedValue(1);

  // Rotate status messages with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      messageOpacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );

      // Change message after fade out
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % DISCOVERY_MESSAGES.length);
      }, 200);
    }, MESSAGE_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [messageOpacity]);

  // Check for expand prompt after 10 minutes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (data.offers.length === 0) {
        setShowExpandPrompt(true);
        onShowExpandPrompt?.();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearTimeout(timeout);
  }, [data.offers.length, onShowExpandPrompt]);

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

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

  const handleExpandSearch = async () => {
    setShowExpandPrompt(false);
    await expandDiscovery();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride request?',
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

        <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
          <Text style={styles.statusMessage}>
            {DISCOVERY_MESSAGES[messageIndex]}
          </Text>
        </Animated.View>

        {data.notifiedDriverCount > 0 && (
          <Text variant="caption" style={styles.notifiedCount}>
            {data.notifiedDriverCount} driver
            {data.notifiedDriverCount === 1 ? '' : 's'} notified
          </Text>
        )}
      </View>

      {/* Peek/Expanded content */}
      {!isCollapsed && (
        <Animated.View style={[styles.expandedContent, expandedStyle]}>
          {/* Route summary */}
          {data.origin && data.destination && (
            <View style={styles.routeSummary}>
              <RouteHeader
                originLabel={data.origin.name}
                destinationLabel={data.destination.name}
                compact
              />
              {data.fareAmount && (
                <Text style={styles.fareText}>
                  {formatPrice(data.fareAmount)}
                </Text>
              )}
            </View>
          )}

          {/* Expand search prompt */}
          {showExpandPrompt && (
            <View style={styles.expandPrompt}>
              <Text style={styles.expandPromptTitle}>
                We couldn't find a nearby driver yet
              </Text>
              <Text variant="caption" style={styles.expandPromptText}>
                Want us to look a bit farther out?
              </Text>
              <View style={styles.expandPromptButtons}>
                <Button
                  label="Expand Search"
                  onPress={handleExpandSearch}
                  style={styles.expandButton}
                />
                <Pressable
                  onPress={handleCancel}
                  style={styles.cancelPromptButton}
                >
                  <Text style={styles.cancelPromptText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Skeleton preview cards */}
          {!showExpandPrompt && data.offers.length === 0 && (
            <View style={styles.skeletonSection}>
              <Text variant="caption" style={styles.skeletonLabel}>
                Waiting for driver responses...
              </Text>
              <View style={styles.skeletonRow}>
                <DriverCardSkeleton style={styles.skeletonCard} />
                <DriverCardSkeleton style={styles.skeletonCard} />
              </View>
            </View>
          )}

          {/* Info text */}
          {!showExpandPrompt && (
            <View style={styles.infoSection}>
              <Text variant="caption" style={styles.infoText}>
                Drivers will be notified of your ride request. You'll see their
                offers as they come in.
              </Text>
            </View>
          )}

          {/* Cancel link (only if not showing expand prompt) */}
          {!showExpandPrompt && (
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel search</Text>
            </Pressable>
          )}
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
  messageContainer: {
    marginTop: space[4],
  },
  statusMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notifiedCount: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: space[3],
  },
  expandedContent: {
    flex: 1,
    marginTop: space[4],
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
  },
  fareText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  expandPrompt: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space[5],
    marginTop: space[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: space[2],
  },
  expandPromptText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: space[4],
  },
  expandPromptButtons: {
    flexDirection: 'row',
    gap: space[3],
  },
  expandButton: {
    flex: 1,
  },
  cancelPromptButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  cancelPromptText: {
    color: colors.textMuted,
    fontWeight: '600',
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
  skeletonSection: {
    marginTop: space[4],
  },
  skeletonLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: space[3],
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[3],
  },
  skeletonCard: {
    flex: 1,
  },
});
