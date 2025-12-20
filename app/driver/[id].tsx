import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing } from '@/constants/design-tokens';
import { getDriverById } from '@/data/drivers';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/src/ui/providers/ToastProvider';

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const driver = getDriverById(id);

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
    router.push('/route-input');
  };

  if (!driver) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Driver not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
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

          <ThemedText style={styles.name}>{driver.name}</ThemedText>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={20} color="#FFB800" />
            <ThemedText style={styles.rating}>
              {driver.rating.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.reviewCount, { color: secondaryTextColor }]}>
              ({driver.reviewCount} reviews)
            </ThemedText>
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
            <ThemedText
              style={[
                styles.statusText,
                { color: driver.onDuty ? onDutyColor : offDutyColor },
              ]}
            >
              {driver.onDuty ? 'On Duty' : 'Off Duty'}
            </ThemedText>
          </View>
        </View>

        {/* Contact Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={styles.sectionTitle}>CONTACT</ThemedText>

          <Pressable style={styles.contactRow} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={tintColor} />
            <ThemedText style={styles.contactText}>{driver.phone}</ThemedText>
            <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <Pressable style={styles.contactRow} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={20} color={tintColor} />
            <ThemedText style={styles.contactText}>{driver.email}</ThemedText>
            <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Ionicons name="language-outline" size={20} color={secondaryTextColor} />
            <ThemedText style={[styles.infoText, { color: secondaryTextColor }]}>
              {driver.languages.join(', ')}
            </ThemedText>
          </View>
        </View>

        {/* Details Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={styles.sectionTitle}>VEHICLE</ThemedText>

          <View style={styles.infoRow}>
            <Ionicons name="car-sport-outline" size={20} color={secondaryTextColor} />
            <ThemedText style={styles.infoText}>
              {driver.vehicleType} • {driver.vehicleModel}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color={secondaryTextColor} />
            <ThemedText style={styles.infoText}>{driver.licensePlate}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={secondaryTextColor} />
            <ThemedText style={styles.infoText}>
              {driver.yearsExperience} years experience
            </ThemedText>
          </View>
        </View>

        {/* Bio Section */}
        <View style={[styles.section, { backgroundColor: cardBackgroundColor }]}>
          <ThemedText style={styles.sectionTitle}>ABOUT</ThemedText>
          <ThemedText style={[styles.bio, { color: secondaryTextColor }]}>
            {driver.bio}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Book Ride Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
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
          <ThemedText style={styles.bookButtonText}>
            {driver.onDuty ? 'Book Ride' : 'Driver Off Duty'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
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
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.card,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: Spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  bookButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

