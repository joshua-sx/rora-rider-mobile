import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/src/ui/components/Badge';
import { Card } from '@/src/ui/components/Card';
import { EmptyState } from '@/src/ui/components/EmptyState';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { useFavoriteDriversStore } from '@/src/store/favorite-drivers-store';
import { MOCK_DRIVERS } from '@/src/features/drivers/data/drivers';
import { Ionicons } from '@expo/vector-icons';

export default function FavoriteDriversScreen() {
  const { favoriteDriverIds, removeFavorite } = useFavoriteDriversStore();
  const insets = useSafeAreaInsets();

  // Get actual driver objects for favorite IDs
  const favoriteDrivers = MOCK_DRIVERS.filter((driver) =>
    favoriteDriverIds.includes(driver.id)
  );

  const handleRemoveFavorite = (driverId: string, driverName: string) => {
    Alert.alert('Remove Favorite', `Remove ${driverName} from favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFavorite(driverId);
        },
      },
    ]);
  };

  const handleDriverPress = (driverId: string) => {
    router.push(`/driver/${driverId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
          onPress={() => router.back()}
        />
        <Text variant="h2" style={styles.headerTitle}>
          Favorite Drivers
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, space[4]) },
        ]}>
        {favoriteDrivers.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="star-outline" size={48} color={colors.textMuted} />}
            message="No favorite drivers yet. Star drivers you like for quick access."
            actionLabel="Browse Drivers"
            onAction={() => router.push('/(tabs)/drivers')}
          />
        ) : (
          <>
            <Text variant="sub" muted style={styles.infoText}>
              {favoriteDrivers.length} {favoriteDrivers.length === 1 ? 'driver' : 'drivers'}
            </Text>

            {favoriteDrivers.map((driver) => (
              <Pressable key={driver.id} onPress={() => handleDriverPress(driver.id)}>
                <Card style={styles.driverCard}>
                  {/* Driver Header */}
                  <Box style={styles.driverHeader}>
                    <Box style={styles.avatar}>
                      <Ionicons name="person" size={32} color={colors.primary} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Box style={styles.nameRow}>
                        <Text variant="body" style={styles.driverName}>
                          {driver.name}
                        </Text>
                        <IconButton
                          icon={
                            <Ionicons
                              name="star"
                              size={20}
                              color={colors.warning}
                            />
                          }
                          onPress={() => handleRemoveFavorite(driver.id, driver.name)}
                        />
                      </Box>
                      <Box style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color={colors.warning} />
                        <Text variant="sub" style={styles.rating}>
                          {driver.rating.toFixed(1)}
                        </Text>
                        <Text variant="sub" muted>
                          ({driver.reviewCount} reviews)
                        </Text>
                      </Box>
                    </Box>
                  </Box>

                  {/* Driver Status */}
                  <Box style={styles.statusRow}>
                    <Badge
                      label={driver.onDuty ? 'On Duty' : 'Off Duty'}
                      tone={driver.onDuty ? 'success' : 'neutral'}
                    />
                    <Text variant="sub" muted>
                      {driver.yearsExperience} years experience
                    </Text>
                  </Box>

                  {/* Vehicle Info */}
                  <Box style={styles.vehicleInfo}>
                    <Box style={styles.infoRow}>
                      <Ionicons name="car" size={16} color={colors.textMuted} />
                      <Text variant="sub" muted>
                        {driver.vehicleType} - {driver.vehicleModel}
                      </Text>
                    </Box>
                    <Box style={styles.infoRow}>
                      <Ionicons name="card-outline" size={16} color={colors.textMuted} />
                      <Text variant="sub" muted>
                        {driver.licensePlate}
                      </Text>
                    </Box>
                  </Box>

                  {/* Languages */}
                  <Box style={styles.languagesRow}>
                    <Ionicons name="language" size={16} color={colors.textMuted} />
                    <Text variant="sub" muted>
                      {driver.languages.join(', ')}
                    </Text>
                  </Box>

                  {/* Bio Preview */}
                  {driver.bio && (
                    <Text variant="sub" muted numberOfLines={2} style={styles.bio}>
                      {driver.bio}
                    </Text>
                  )}

                  {/* Quick Actions */}
                  <Box style={styles.actions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert('Call Driver', `Call ${driver.name}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Call', onPress: () => console.log('Calling driver') },
                        ]);
                      }}>
                      <Ionicons name="call-outline" size={18} color={colors.primary} />
                      <Text variant="sub" style={{ color: colors.primary }}>
                        Call
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert('Message Driver', 'Messaging coming soon');
                      }}>
                      <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                      <Text variant="sub" style={{ color: colors.primary }}>
                        Message
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.bookButton,
                        !driver.onDuty && styles.bookButtonDisabled,
                      ]}
                      onPress={() => {
                        if (driver.onDuty) {
                          router.push('/route-input');
                        }
                      }}
                      disabled={!driver.onDuty}>
                      <Ionicons
                        name="navigate"
                        size={18}
                        color={driver.onDuty ? colors.primaryText : colors.textMuted}
                      />
                      <Text
                        variant="sub"
                        style={{
                          color: driver.onDuty ? colors.primaryText : colors.textMuted,
                          fontWeight: '600',
                        }}>
                        Book Ride
                      </Text>
                    </Pressable>
                  </Box>
                </Card>
              </Pressable>
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
    backgroundColor: colors.bg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
    gap: space[4],
  },
  infoText: {
    marginBottom: space[2],
  },
  driverCard: {
    padding: space[4],
    gap: space[3],
  },
  driverHeader: {
    flexDirection: 'row',
    gap: space[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverName: {
    fontWeight: '600',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    marginTop: 4,
  },
  rating: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleInfo: {
    gap: space[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  bio: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[2],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
    paddingVertical: space[2],
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bookButtonDisabled: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
  },
});
