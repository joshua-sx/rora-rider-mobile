import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Terms of Service
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text variant="sub" muted style={styles.lastUpdated}>
          Last updated: January 1, 2026
        </Text>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            1. Acceptance of Terms
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            By accessing or using the Rora Ride mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Rora Ride is a ride-hailing platform that connects riders with licensed taxi drivers in Sint Maarten. We provide a technology platform; we are not a transportation carrier or taxi service.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            2. User Accounts
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            You may use the App as a guest or create an account. If you create an account, you are responsible for maintaining the confidentiality of your account information and for all activities under your account.
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            3. Services
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Rora Ride enables you to request taxi rides from independent driver-partners. The transportation services are provided by independent taxi drivers, not by Rora Ride.
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We do not guarantee the availability of drivers, the quality of transportation services, or specific arrival times. Service availability may vary based on location, time, and driver availability.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            4. Payments
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Rora Ride operates primarily on a cash-payment basis. You agree to pay the fare shown in the App directly to your driver at the end of each ride.
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Fare estimates are provided for informational purposes and may vary based on actual route, traffic conditions, and other factors. The final fare is determined by the actual trip distance and applicable rates.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            5. User Conduct
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            You agree not to:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Use the App for any unlawful purpose
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Harass, threaten, or harm drivers or other users
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Provide false information or impersonate others
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Interfere with the proper functioning of the App
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Attempt to circumvent security features
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            6. Safety
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            While we strive to ensure a safe experience, you acknowledge that using transportation services involves inherent risks. Always verify driver and vehicle details before entering a vehicle.
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            The QR code verification system is designed to enhance safety. We encourage you to use this feature for every ride.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            7. Intellectual Property
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            The App and its content, features, and functionality are owned by Rora Ride and are protected by international copyright, trademark, and other intellectual property laws.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            8. Limitation of Liability
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            To the maximum extent permitted by law, Rora Ride shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App or services.
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We are not responsible for the actions, omissions, or negligence of drivers or other users.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            9. Modifications
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. We will notify you of significant changes through the App or via email. Your continued use of the App after changes constitutes acceptance of the modified Terms.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            10. Governing Law
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of Sint Maarten, without regard to its conflict of law provisions.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            11. Contact Us
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at:
          </Text>
          <Text variant="body" style={styles.contactInfo}>
            legal@roraride.com
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Rora Ride{'\n'}
            Philipsburg, Sint Maarten
          </Text>
        </Box>

        <View style={{ height: space[8] }} />
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
  lastUpdated: {
    marginBottom: space[6],
    fontStyle: 'italic',
  },
  section: {
    marginBottom: space[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: space[3],
    color: colors.text,
  },
  paragraph: {
    lineHeight: 24,
    marginBottom: space[3],
  },
  listItem: {
    lineHeight: 24,
    marginBottom: space[2],
    paddingLeft: space[2],
  },
  contactInfo: {
    color: colors.primary,
    marginBottom: space[3],
  },
});
