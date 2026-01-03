import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import type { Driver } from '@/src/types/driver';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Text } from '../primitives/Text';
import { Box } from '../primitives/Box';
import { colors } from '../tokens/colors';
import { space } from '../tokens/spacing';

interface BookingOptionsSheetProps {
  driver: Driver;
  isVisible: boolean;
  onDismiss: () => void;
  onBookNow: () => void;
  onUseSaved: () => void;
  hasSavedTrips: boolean;
}

/**
 * BookingOptionsSheet - Modal shown after "Book Ride" button on driver profile
 * Presents two options: Book New Ride or Use Saved Trip
 */
export function BookingOptionsSheet({
  driver,
  isVisible,
  onDismiss,
  onBookNow,
  onUseSaved,
  hasSavedTrips,
}: BookingOptionsSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (isVisible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isVisible]);

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      onDismiss();
    }
  };

  return (
    <Sheet
      ref={sheetRef}
      index={-1}
      snapPoints={['50%']}
      enablePanDownToClose
      onChange={handleSheetChange}
      contentContainerStyle={styles.content}
    >
      {/* Driver Info Header */}
      <Box style={styles.header}>
        <Text variant="h3" style={styles.headerTitle}>
          Booking with {driver.name}
        </Text>
        <Box style={styles.driverMeta}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text variant="sub" muted>
            {driver.rating}
          </Text>
          <Text variant="sub" muted>
            •
          </Text>
          <Text variant="sub" muted>
            {driver.vehicleType}
          </Text>
        </Box>
      </Box>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Action Buttons */}
      <Box style={styles.actions}>
        {/* Primary: Book New Ride */}
        <Button
          label="Book New Ride"
          onPress={onBookNow}
          variant="primary"
          left={<Ionicons name="add-circle-outline" size={20} color={colors.primaryText} />}
        />
        <Text variant="sub" muted style={styles.actionDescription}>
          Enter pickup & destination
        </Text>

        {/* Secondary: Use Saved Trip */}
        <Button
          label="Use Saved Trip"
          onPress={onUseSaved}
          variant="secondary"
          disabled={!hasSavedTrips}
          left={<Ionicons name="bookmark-outline" size={20} color={hasSavedTrips ? colors.text : colors.muted} />}
          style={styles.secondaryButton}
        />
        <Text variant="sub" muted style={styles.actionDescription}>
          {hasSavedTrips ? 'Select from saved trips' : 'No saved trips available'}
        </Text>

        {/* Cancel */}
        <Button
          label="Cancel"
          onPress={onDismiss}
          variant="tertiary"
          style={styles.cancelButton}
        />
      </Box>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space[4],
    paddingBottom: space[6],
  },
  header: {
    alignItems: 'center',
    paddingVertical: space[4],
    gap: space[2],
  },
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: space[4],
  },
  actions: {
    gap: space[2],
  },
  actionDescription: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: space[3],
  },
  secondaryButton: {
    marginTop: space[2],
  },
  cancelButton: {
    marginTop: space[2],
  },
});
