import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, Box, space, radius } from '@/src/ui';
import { BookingOptionsSheet } from '@/src/ui/components/BookingOptionsSheet';
import { getDriverById } from '@/src/features/drivers/data/drivers';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { useToast } from '@/src/ui/providers/ToastProvider';
import { useRouteStore } from '@/src/store/route-store';
import { useTripHistoryStore } from '@/src/store/trip-history-store';

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [showBookingOptions, setShowBookingOptions] = useState(false);

  const driver = getDriverById(id);
  const savedTripsCount = useTripHistoryStore((state) => state.getSavedTrips().length);

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const cardBackgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const textColor = useThemeColor({ light: '#262626', dark: '#E5E7EA' }, 'text');
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#8B8F95' },
    'textSecondary'
  );
  const borderColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );
  const tintColor = useThemeColor({}, 'tint');
  const onDutyColor = '#00BE3C';
  const offDutyColor = '#8C9390';

  const handleBack = () => {
    router.back();
  };

  const handleCall = () => {
    if (driver?.phone) {
      showToast('Opening phone...');
      Linking.openURL(`tel:${driver.phone}`);
    }
  };

  const handleEmail = () => {
    if (driver?.email) {
      showToast('Opening email...');
      Linking.openURL(`mailto:${driver.email}`);
    }
  };

  const handleBookRide = () => {
    setShowBookingOptions(true);
  };

  const handleBookNow = () => {
    setShowBookingOptions(false);
    if (driver) {
      // Set driver in route store
      useRouteStore.getState().setSelectedDriver(driver.id);
      router.push('/route-input');
    }
  };

  const handleUseSaved = () => {
    setShowBookingOptions(false);
    if (driver) {
      // Set driver in route store
      useRouteStore.getState().setSelectedDriver(driver.id);
      router.push(`/trip-selector?driverId=${driver.id}`);
    }
  };

  if (!driver) {
    return (
      <Box style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Driver not found</Text>
        </View>
      </Box>
    );
  }

  return (
    <Box style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={[styles.profileImage, { backgroundColor: borderColor }]}>
            <Ionicons name="person" size={64} color={secondaryTextColor} />
          </View>

          <Text style={styles.name}>{driver.name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={20} color="#FFB800" />
            <Text style={styles.rating}>
              {driver.rating.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: secondaryTextColor }]}>
              ({driver.reviewCount} reviews)
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: driver.onDuty
                  ? `${onDutyColor}20`
                  : `${offDutyColor}20`,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: driver.onDuty ? onDutyColor : offDutyColor,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: driver.onDuty ? onDutyColor : offDutyColor },
              ]}
            >
              {driver.onDuty ? 'On Duty' : 'Off Duty'}
            </Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <Text style={styles.sectionTitle}>CONTACT</Text>

          <Pressable style={styles.contactRow} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={tintColor} />
            <Text style={styles.contactText}>{driver.phone}</Text>
            <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <Pressable style={styles.contactRow} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={20} color={tintColor} />
            <Text style={styles.contactText}>{driver.email}</Text>
            <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Ionicons name="language-outline" size={20} color={secondaryTextColor} />
            <Text style={[styles.infoText, { color: secondaryTextColor }]}>
              {driver.languages.join(', ')}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <Text style={styles.sectionTitle}>VEHICLE</Text>

          <View style={styles.infoRow}>
            <Ionicons name="car-sport-outline" size={20} color={secondaryTextColor} />
            <Text style={styles.infoText}>
              {driver.vehicleType} • {driver.vehicleModel}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color={secondaryTextColor} />
            <Text style={styles.infoText}>{driver.licensePlate}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={secondaryTextColor} />
            <Text style={styles.infoText}>
              {driver.yearsExperience} years experience
            </Text>
          </View>
        </View>

        {/* Bio Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <Text style={[styles.bio, { color: secondaryTextColor }]}>
            {driver.bio}
          </Text>
        </View>
      </ScrollView>

      {/* Book Ride Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, space[4]),
            borderTopColor: borderColor,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.bookButton,
            {
              backgroundColor: driver.onDuty ? onDutyColor : offDutyColor,
              opacity: pressed ? 0.8 : driver.onDuty ? 1 : 0.6,
            },
          ]}
          onPress={handleBookRide}
          disabled={!driver.onDuty}
        >
          <Text style={styles.bookButtonText}>
            {driver.onDuty ? 'Book Ride' : 'Driver Off Duty'}
          </Text>
        </Pressable>
      </View>

      {/* Booking Options Sheet */}
      <BookingOptionsSheet
        driver={driver}
        isVisible={showBookingOptions}
        onDismiss={() => setShowBookingOptions(false)}
        onBookNow={handleBookNow}
        onUseSaved={handleUseSaved}
        hasSavedTrips={savedTripsCount > 0}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space[6],
  },
  header: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: space[5],
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: space[2],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: space[3],
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: space[4],
    marginBottom: space[4],
    padding: space[4],
    borderRadius: radius.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: space[3],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
  },
  contactText: {
    flex: 1,
    fontSize: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
  },
  infoText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: space[1],
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space[4],
    paddingTop: space[4],
    borderTopWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  bookButton: {
    paddingVertical: space[4],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
