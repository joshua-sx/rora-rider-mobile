import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import type BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import type { Venue } from '@/src/types/venue';
import { Sheet, Button } from '@/src/ui';
import { Text } from '@/src/ui/primitives/Text';
import { Box } from '@/src/ui/primitives/Box';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';

type RideCtaSheetProps = {
  venue: Venue;
  isVisible: boolean;
  onClose: () => void;
  onGetQuote: () => void;
  onEditPickup?: () => void;
};

export function RideCtaSheet({
  venue,
  isVisible,
  onClose,
  onGetQuote,
  onEditPickup,
}: RideCtaSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['55%'], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isVisible) {
    return null;
  }

  return (
    <Sheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <Box style={styles.header}>
        <Text variant="title">
          Get a ride to {venue.name}
        </Text>
      </Box>

      {/* Pickup Field */}
      <Box style={styles.fieldContainer}>
        <Box style={styles.fieldHeader}>
          <Text variant="cap" muted>
            PICKUP
          </Text>
        </Box>
        <Pressable
          style={styles.fieldInput}
          onPress={onEditPickup}
        >
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.fieldValue}>Current Location</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      </Box>

      {/* Destination Field (Locked) */}
      <Box style={styles.fieldContainer}>
        <Box style={styles.fieldHeader}>
          <Text variant="cap" muted>
            DESTINATION
          </Text>
        </Box>
        <Box style={[styles.fieldInput, styles.fieldLocked]}>
          <Ionicons name="location" size={18} color={colors.textMuted} />
          <Text style={[styles.fieldValue, { flex: 1 }]}>
            {venue.name}
          </Text>
          <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
        </Box>
      </Box>

      {/* Route Preview */}
      <Box style={styles.routePreview}>
        <Box style={styles.routeItem}>
          <Ionicons name="time-outline" size={20} color={colors.textMuted} />
          <Text style={styles.routeText}>
            ~{venue.estimatedDuration || 12} min
          </Text>
        </Box>
        <Box style={styles.routeDivider} />
        <Box style={styles.routeItem}>
          <Ionicons name="navigate-outline" size={20} color={colors.textMuted} />
          <Text style={styles.routeText}>
            ~{venue.distance} km
          </Text>
        </Box>
      </Box>

      {/* CTA Button */}
      <Button
        label="Get Official Quote & View Drivers"
        onPress={onGetQuote}
        variant="primary"
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  background: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleIndicator: {
    // Custom handle styling if needed
  },
  contentContainer: {
    paddingHorizontal: space[6],
    paddingTop: space[2],
  },
  header: {
    marginBottom: space[6],
  },
  fieldContainer: {
    marginBottom: space[4],
  },
  fieldHeader: {
    marginBottom: space[2],
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space[3],
  },
  fieldLocked: {
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: space[4],
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  routeDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: space[6],
  },
  routeText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});
