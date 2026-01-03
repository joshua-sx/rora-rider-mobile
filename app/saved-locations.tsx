import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { Divider } from '@/src/ui/components/Divider';
import { EmptyState } from '@/src/ui/components/EmptyState';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { useSavedLocationsStore, type SavedLocation } from '@/src/store/saved-locations-store';
import { Ionicons } from '@expo/vector-icons';

export default function SavedLocationsScreen() {
  const { locations, removeLocation } = useSavedLocationsStore();

  const homeLocation = locations.find((loc) => loc.label === 'Home');
  const workLocation = locations.find((loc) => loc.label === 'Work');
  const customLocations = locations.filter((loc) => loc.label !== 'Home' && loc.label !== 'Work');

  const handleRemoveLocation = (location: SavedLocation) => {
    Alert.alert('Remove Location', `Remove "${location.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeLocation(location.id);
        },
      },
    ]);
  };

  const handleAddLocation = (type: 'home' | 'work' | 'custom') => {
    Alert.alert(
      'Add Location',
      type === 'custom'
        ? 'Search and save a location'
        : `Add your ${type === 'home' ? 'home' : 'work'} address`,
      [{ text: 'OK' }]
    );
    // Would navigate to location search/add screen
  };

  const renderLocationCard = (location: SavedLocation, type: 'home' | 'work' | 'custom') => {
    const iconName =
      type === 'home' ? 'home' : type === 'work' ? 'briefcase' : 'location';

    return (
      <Card key={location.id} style={styles.locationCard}>
        <Box style={styles.locationHeader}>
          <Box style={styles.locationIcon}>
            <Ionicons name={iconName} size={24} color={colors.primary} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text variant="body" style={styles.locationLabel}>
              {location.label}
            </Text>
            <Text variant="sub" muted style={styles.locationName}>
              {location.name}
            </Text>
            <Text variant="sub" muted style={styles.locationAddress}>
              {location.address}
            </Text>
          </Box>
        </Box>

        <Divider style={{ marginVertical: space[3] }} />

        <Box style={styles.locationActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              Alert.alert('Edit Location', 'Edit location functionality coming soon');
            }}>
            <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            <Text variant="sub" style={{ color: colors.primary }}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => {
              // Navigate to route input with this location as destination
              Alert.alert('Get Directions', 'Navigate to this location');
            }}>
            <Ionicons name="navigate-outline" size={20} color={colors.primary} />
            <Text variant="sub" style={{ color: colors.primary }}>
              Directions
            </Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => handleRemoveLocation(location)}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text variant="sub" style={{ color: colors.danger }}>
              Remove
            </Text>
          </Pressable>
        </Box>
      </Card>
    );
  };

  const renderQuickAddCard = (type: 'home' | 'work') => {
    const label = type === 'home' ? 'Home' : 'Work';
    const icon = type === 'home' ? 'home-outline' : 'briefcase-outline';
    const description =
      type === 'home' ? 'Add your home address for quick access' : 'Add your work address for quick access';

    return (
      <Card key={`add-${type}`} style={styles.quickAddCard}>
        <Box style={styles.quickAddContent}>
          <Ionicons name={icon} size={32} color={colors.textMuted} />
          <Box style={{ flex: 1 }}>
            <Text variant="body" style={styles.quickAddLabel}>
              Add {label}
            </Text>
            <Text variant="sub" muted>
              {description}
            </Text>
          </Box>
          <IconButton
            icon={<Ionicons name="add-circle" size={28} color={colors.primary} />}
            onPress={() => handleAddLocation(type)}
          />
        </Box>
      </Card>
    );
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
          Saved Locations
        </Text>
        <IconButton
          icon={<Ionicons name="add" size={24} color={colors.text} />}
          onPress={() => handleAddLocation('custom')}
        />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Home & Work Quick Add */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Quick Access
          </Text>
          {!homeLocation && renderQuickAddCard('home')}
          {homeLocation && renderLocationCard(homeLocation, 'home')}

          {!workLocation && renderQuickAddCard('work')}
          {workLocation && renderLocationCard(workLocation, 'work')}
        </Box>

        {/* Custom Locations */}
        {customLocations.length > 0 && (
          <Box style={styles.section}>
            <Text variant="body" style={styles.sectionTitle}>
              Other Locations
            </Text>
            {customLocations.map((location) => renderLocationCard(location, 'custom'))}
          </Box>
        )}

        {/* Empty State */}
        {locations.length === 0 && (
          <EmptyState
            icon={<Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />}
            message="No saved locations yet. Add your home, work, or favorite places for quick access."
            actionLabel="Add Location"
            onAction={() => handleAddLocation('custom')}
          />
        )}

        {/* Info Card */}
        {locations.length > 0 && (
          <Card style={styles.infoCard}>
            <Box style={styles.infoContent}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text variant="sub" style={{ flex: 1, color: colors.textMuted }}>
                Saved locations appear as quick options when planning a route
              </Text>
            </Box>
          </Card>
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
  },
  section: {
    marginBottom: space[6],
    gap: space[3],
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space[2],
  },
  locationCard: {
    padding: space[4],
  },
  locationHeader: {
    flexDirection: 'row',
    gap: space[3],
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  locationName: {
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
  },
  locationActions: {
    flexDirection: 'row',
    gap: space[4],
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
  },
  quickAddCard: {
    padding: space[4],
    borderStyle: 'dashed',
  },
  quickAddContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  quickAddLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  infoCard: {
    padding: space[3],
    backgroundColor: colors.bg,
    marginTop: space[4],
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
});
