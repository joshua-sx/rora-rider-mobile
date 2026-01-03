import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Divider } from '@/src/ui/components/Divider';
import { IconButton } from '@/src/ui/components/IconButton';
import { ListItem } from '@/src/ui/components/ListItem';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

type Language = 'en' | 'es' | 'fr';
type Theme = 'light' | 'dark' | 'auto';

export default function SettingsScreen() {
  // Settings state (these would typically come from a settings store)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [tripUpdates, setTripUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [selectedLanguage] = useState<Language>('en');
  const [selectedTheme] = useState<Theme>('auto');

  const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
  };

  const themeNames: Record<Theme, string> = {
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h3" style={styles.headerTitle}>
          Settings
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView}>
        {/* Notifications Section */}
        <Box style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Notifications
          </Text>

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Push Notifications
              </Text>
              <Text variant="sub" muted>
                Receive push notifications on your device
              </Text>
            </Box>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Email Notifications
              </Text>
              <Text variant="sub" muted>
                Receive updates via email
              </Text>
            </Box>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Trip Updates
              </Text>
              <Text variant="sub" muted>
                Driver arrival, trip start, completion
              </Text>
            </Box>
            <Switch
              value={tripUpdates}
              onValueChange={setTripUpdates}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Divider />

          <View style={styles.settingItem}>
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.settingLabel}>
                Promotions
              </Text>
              <Text variant="sub" muted>
                Special offers and deals
              </Text>
            </Box>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Box>

        {/* Appearance Section */}
        <Box style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Appearance
          </Text>

          <ListItem
            title="Theme"
            subtitle={themeNames[selectedTheme]}
            onPress={() => {
              Alert.alert('Theme', 'Theme selection coming soon');
            }}
            leading={<Ionicons name="moon-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
        </Box>

        {/* Language & Region Section */}
        <Box style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Language & Region
          </Text>

          <ListItem
            title="Language"
            subtitle={languageNames[selectedLanguage]}
            onPress={() => {
              Alert.alert('Language', 'Language selection coming soon');
            }}
            leading={<Ionicons name="language-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
        </Box>

        {/* Privacy Section */}
        <Box style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Privacy
          </Text>

          <ListItem
            title="Privacy Settings"
            subtitle="Data sharing and permissions"
            onPress={() => {
              Alert.alert('Privacy', 'Privacy settings coming soon');
            }}
            leading={<Ionicons name="shield-checkmark-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <Divider />

          <ListItem
            title="Location Permissions"
            subtitle="Manage location access"
            onPress={() => {
              Alert.alert('Location', 'Open system settings to manage location permissions');
            }}
            leading={<Ionicons name="location-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
        </Box>

        {/* Payment Section */}
        <Box style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Payment
          </Text>

          <ListItem
            title="Payment Methods"
            subtitle="Manage cards and payment options"
            onPress={() => {
              Alert.alert('Payment Methods', 'Payment management coming soon');
            }}
            leading={<Ionicons name="card-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
        </Box>

        {/* About Section */}
        <Box style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            About
          </Text>

          <ListItem
            title="Help Center"
            subtitle="FAQs and support"
            onPress={() => {
              Alert.alert('Help Center', 'Help center coming soon');
            }}
            leading={<Ionicons name="help-circle-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <Divider />

          <ListItem
            title="Terms of Service"
            onPress={() => {
              Alert.alert('Terms of Service', 'Terms of service coming soon');
            }}
            leading={<Ionicons name="document-text-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <Divider />

          <ListItem
            title="Privacy Policy"
            onPress={() => {
              Alert.alert('Privacy Policy', 'Privacy policy coming soon');
            }}
            leading={<Ionicons name="lock-closed-outline" size={24} color={colors.textMuted} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
          />
          <Divider />

          <ListItem
            title="App Version"
            subtitle="1.0.0"
            leading={<Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />}
          />
        </Box>

        {/* Account Actions */}
        <Box style={styles.section}>
          <ListItem
            title="Sign Out"
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive' },
              ]);
            }}
            leading={<Ionicons name="log-out-outline" size={24} color={colors.danger} />}
            trailing={<Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
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
  section: {
    marginTop: space[6],
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
});
