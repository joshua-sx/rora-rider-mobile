import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Button } from '@/src/ui/components/Button';
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

const RATING_OPTIONS = [1, 2, 3, 4, 5];

/**
 * RideSheetCompleted - Content for COMPLETED state
 *
 * Server state: completed
 * Ride has finished - shows fare summary and rating prompt
 * User can rate the driver and provide feedback
 * Next: User dismisses → IDLE
 */
export function RideSheetCompleted({ animatedIndex, currentIndex }: Props) {
  const data = useRideSheetStore((s) => s.data);
  const dismissCompletion = useRideSheetStore((s) => s.dismissCompletion);

  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);

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

  const handleRatingSelect = (value: number) => {
    setRating(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitRating = async () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Call API to submit rating
    // await submitRating(data.rideSessionId, data.selectedOffer?.driver_user_id, rating);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsSubmitting(false);
    setHasSubmittedRating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDone = () => {
    dismissCompletion();
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report an Issue',
      'What would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wrong Fare',
          onPress: () => Alert.alert('Report Submitted', 'We will review this fare dispute.'),
        },
        {
          text: 'Safety Concern',
          onPress: () => Alert.alert('Report Submitted', 'We take safety seriously and will investigate.'),
        },
        {
          text: 'Other Issue',
          onPress: () => Alert.alert('Report Submitted', 'Our support team will contact you.'),
        },
      ]
    );
  };

  const isCollapsed = currentIndex === 0;

  // Calculate ride duration if we have timestamps
  const rideDurationMinutes = data.startedAt && data.completedAt
    ? Math.round((new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime()) / 60000)
    : null;

  return (
    <View style={styles.container}>
      {/* Status section (always visible) */}
      <View style={styles.statusSection}>
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
        </View>

        <Text style={styles.statusTitle}>Ride Complete!</Text>

        {data.finalFareAmount && (
          <Text style={styles.fareAmount}>
            {formatPrice(data.finalFareAmount)}
          </Text>
        )}

        {rideDurationMinutes && (
          <Text variant="caption" style={styles.durationText}>
            {rideDurationMinutes} minute ride
          </Text>
        )}
      </View>

      {/* Peek/Expanded content */}
      {!isCollapsed && (
        <Animated.View style={[styles.expandedContent, expandedStyle]}>
          {/* Driver rating section */}
          {!hasSubmittedRating ? (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>
                How was your ride with {data.driverName || 'your driver'}?
              </Text>

              <View style={styles.starsContainer}>
                {RATING_OPTIONS.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => handleRatingSelect(value)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={rating && rating >= value ? 'star' : 'star-outline'}
                      size={36}
                      color={rating && rating >= value ? colors.warning : colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>

              {rating && (
                <Button
                  label={isSubmitting ? 'Submitting...' : 'Submit Rating'}
                  onPress={handleSubmitRating}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                />
              )}
            </View>
          ) : (
            <View style={styles.thankYouSection}>
              <Ionicons name="heart" size={32} color={colors.primary} />
              <Text style={styles.thankYouText}>
                Thanks for your feedback!
              </Text>
            </View>
          )}

          {/* Ride summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="location" size={18} color={colors.textSecondary} />
                <Text variant="caption" style={styles.summaryLabel}>From</Text>
              </View>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {data.origin?.name || 'Pickup location'}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="flag" size={18} color={colors.textSecondary} />
                <Text variant="caption" style={styles.summaryLabel}>To</Text>
              </View>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {data.destination?.name || 'Destination'}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="car" size={18} color={colors.textSecondary} />
                <Text variant="caption" style={styles.summaryLabel}>Driver</Text>
              </View>
              <Text style={styles.summaryValue}>
                {data.driverName || 'Your driver'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Button
              label="Done"
              onPress={handleDone}
              style={styles.doneButton}
            />

            <Pressable onPress={handleReportIssue} style={styles.reportButton}>
              <Text style={styles.reportButtonText}>Report an issue</Text>
            </Pressable>
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
  completedBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[3],
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginTop: space[2],
  },
  durationText: {
    color: colors.textSecondary,
    marginTop: space[1],
  },
  expandedContent: {
    flex: 1,
    marginTop: space[3],
  },
  ratingSection: {
    alignItems: 'center',
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: space[4],
  },
  starsContainer: {
    flexDirection: 'row',
    gap: space[2],
  },
  starButton: {
    padding: space[2],
  },
  submitButton: {
    marginTop: space[4],
    width: '100%',
  },
  thankYouSection: {
    alignItems: 'center',
    padding: space[5],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space[3],
  },
  thankYouText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summarySection: {
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: space[4],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[2],
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    width: 80,
  },
  summaryLabel: {
    color: colors.textSecondary,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space[2],
  },
  actionsSection: {
    marginTop: space[4],
    gap: space[3],
  },
  doneButton: {
    width: '100%',
  },
  reportButton: {
    alignItems: 'center',
    paddingVertical: space[3],
  },
  reportButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
