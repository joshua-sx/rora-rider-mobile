import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/ui/components/Button';
import { Card } from '@/src/ui/components/Card';
import { Divider } from '@/src/ui/components/Divider';
import { IconButton } from '@/src/ui/components/IconButton';
import { ListItem } from '@/src/ui/components/ListItem';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacySettingsScreen() {
  // Privacy settings state - would typically come from a store
  const [shareLocation, setShareLocation] = useState(true);
  const [shareRideHistory, setShareRideHistory] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [personalization, setPersonalization] = useState(true);

  const handleOpenLocationSettings = () => {
    Linking.openSettings();
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download Your Data',
      'We\'ll prepare a copy of your data and send it to your registered email within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Download',
          onPress: () => {
            Alert.alert('Request Submitted', 'You\'ll receive an email when your data is ready.');
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete Your Data',
      'This will permanently delete all your personal data, including ride history and saved preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? Your account will remain active but all personal data will be erased.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Data Deleted', 'Your personal data has been deleted.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Privacy Settings
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Location Permissions */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Location
          </Text>

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Share Location While Using App
              </Text>
              <Text variant="sub" muted>
                Required for ride requests and driver matching
              </Text>
            </Box>
            <Switch
              value={shareLocation}
              onValueChange={setShareLocation}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <ListItem
            title="Location Permissions"
            subtitle="Manage in system settings"
            onPress={handleOpenLocationSettings}
            leading={<Ionicons name="location-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="open-outline" size={18} color={colors.textMuted} />}
          />
        </Box>

        {/* Data Sharing */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Data Sharing
          </Text>

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Share Ride History with Drivers
              </Text>
              <Text variant="sub" muted>
                Allows drivers to see your ride history and preferences
              </Text>
            </Box>
            <Switch
              value={shareRideHistory}
              onValueChange={setShareRideHistory}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Analytics & Improvements
              </Text>
              <Text variant="sub" muted>
                Help us improve the app with anonymous usage data
              </Text>
            </Box>
            <Switch
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Personalized Experience
              </Text>
              <Text variant="sub" muted>
                Customize recommendations based on your activity
              </Text>
            </Box>
            <Switch
              value={personalization}
              onValueChange={setPersonalization}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Box>

        {/* Communications */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Communications
          </Text>

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Marketing Emails
              </Text>
              <Text variant="sub" muted>
                Receive promotional offers and updates
              </Text>
            </Box>
            <Switch
              value={marketingEmails}
              onValueChange={setMarketingEmails}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Box>

        {/* Your Data */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Your Data
          </Text>

          <Card style={styles.dataCard}>
            <Box style={styles.dataCardContent}>
              <Box style={styles.dataIcon}>
                <Ionicons name="download-outline" size={24} color={colors.primary} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text variant="body" style={styles.dataTitle}>
                  Download Your Data
                </Text>
                <Text variant="sub" muted>
                  Get a copy of your rides, profile, and activity
                </Text>
              </Box>
            </Box>
            <Button variant="secondary" size="sm" onPress={handleDownloadData}>
              Request Download
            </Button>
          </Card>

          <Card style={[styles.dataCard, styles.dangerCard]}>
            <Box style={styles.dataCardContent}>
              <Box style={[styles.dataIcon, { backgroundColor: colors.danger + '15' }]}>
                <Ionicons name="trash-outline" size={24} color={colors.danger} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text variant="body" style={styles.dataTitle}>
                  Delete Your Data
                </Text>
                <Text variant="sub" muted>
                  Permanently remove your personal information
                </Text>
              </Box>
            </Box>
            <Button variant="tertiary" size="sm" onPress={handleDeleteData}>
              <Text variant="sub" style={{ color: colors.danger }}>
                Delete Data
              </Text>
            </Button>
          </Card>
        </Box>

        {/* Legal Links */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Legal
          </Text>

          <ListItem
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => router.push('/settings/privacy-policy')}
            leading={<Ionicons name="document-text-outline" size={24} color={colors.textMuted} />}
          />
          <Divider />
          <ListItem
            title="Terms of Service"
            subtitle="Rules and guidelines"
            onPress={() => router.push('/settings/terms')}
            leading={<Ionicons name="reader-outline" size={24} color={colors.textMuted} />}
          />
        </Box>

        <View style={{ height: space[6] }} />
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
    paddingVertical: space[4],
  },
  section: {
    marginBottom: space[6],
  },
  sectionTitle: {
    paddingHorizontal: space[4],
    paddingBottom: space[3],
    fontWeight: '600',
    color: colors.textMuted,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  settingLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  dataCard: {
    marginHorizontal: space[4],
    marginBottom: space[3],
    padding: space[4],
    gap: space[3],
  },
  dangerCard: {
    marginBottom: 0,
  },
  dataCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  dataIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
