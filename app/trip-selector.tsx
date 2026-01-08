import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/ui/components/EmptyState';
import { IconButton } from '@/src/ui/components/IconButton';
import { TripCard } from '@/src/ui/components/TripCard';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { useTripHistoryStore } from '@/src/store/trip-history-store';
import { useRouteStore } from '@/src/store/route-store';
import { getDriverById } from '@/src/features/drivers/data/drivers';

export default function TripSelectorScreen() {
  const { driverId } = useLocalSearchParams<{ driverId?: string }>();
  const router = useRouter();

  const availableTrips = useTripHistoryStore((state) => state.getAvailableTrips());
  const updateTripStatus = useTripHistoryStore((state) => state.updateTripStatus);

  const selectedDriver = driverId ? getDriverById(driverId) : null;

  const handleBack = () => {
    // Clear driver selection when going back
    useRouteStore.getState().clearDriver();
    router.back();
  };

  const handleSelectTrip = (tripId: string) => {
    if (!selectedDriver) {
      Alert.alert('Error', 'No driver selected');
      return;
    }

    Alert.alert(
      'Confirm ride request',
      `Request this ride with ${selectedDriver.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Assign driver to trip
            updateTripStatus(tripId, 'pending', driverId);
            // Navigate to trip preview/QR screen
            router.push(`/trip-preview?tripId=${tripId}`);
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    router.push('/route-input');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Select Saved Ride
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      {/* Driver Banner */}
      {selectedDriver && (
        <Box style={styles.driverBanner}>
          <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          <Box style={styles.driverInfo}>
            <Text variant="body" style={styles.driverName}>
              Booking with {selectedDriver.name}
            </Text>
            <Text variant="sub" muted>
              ★ {selectedDriver.rating} • {selectedDriver.vehicleType}
            </Text>
          </Box>
        </Box>
      )}

      {/* Trips List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {availableTrips.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="bookmark-outline" size={48} color={colors.textSecondary} />}
            message="No saved rides available. Create one first!"
            actionLabel="Create New Ride"
            onAction={handleCreateNew}
          />
        ) : (
          <>
            <Text variant="sub" muted style={styles.instructionText}>
              Select a ride to request with {selectedDriver?.name || 'this driver'}
            </Text>
            {availableTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => handleSelectTrip(trip.id)}
                showQuoteAge
                warnIfStale
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  driverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    backgroundColor: `${colors.primary}10`,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  driverInfo: {
    flex: 1,
    gap: space[1],
  },
  driverName: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
  },
  instructionText: {
    marginBottom: space[4],
    textAlign: 'center',
  },
});
