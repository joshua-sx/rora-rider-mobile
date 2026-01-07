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

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Privacy Policy
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text variant="sub" muted style={styles.lastUpdated}>
          Last updated: January 1, 2026
        </Text>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Introduction
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Rora Ride ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Information We Collect
          </Text>

          <Text variant="body" style={styles.subheading}>
            Personal Information
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            When you create an account, we may collect:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Name and contact information
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Phone number and email address
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Profile photo (optional)
          </Text>

          <Text variant="body" style={styles.subheading}>
            Location Information
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We collect location data to provide our ride-hailing services, including:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Pickup and drop-off locations
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Real-time location during rides
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Saved locations (home, work)
          </Text>

          <Text variant="body" style={styles.subheading}>
            Usage Information
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We automatically collect certain information when you use the App:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Device information (type, operating system)
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} App usage patterns and preferences
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Ride history and transaction details
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            How We Use Your Information
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We use the collected information to:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Provide and improve our ride-hailing services
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Connect you with nearby drivers
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Process transactions and send receipts
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Send service-related notifications
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Enhance safety and security features
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Respond to your inquiries and support requests
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Analyze usage patterns to improve the App
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Information Sharing
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We may share your information with:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Drivers - Your name, pickup location, and destination to facilitate rides
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Service providers - Third parties who assist in operating our App
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Legal authorities - When required by law or to protect rights and safety
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We never sell your personal information to third parties.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Data Security
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Encryption of data in transit and at rest
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Secure authentication mechanisms
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Regular security assessments
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Access controls and monitoring
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Your Rights
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Access your personal information
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Correct inaccurate information
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Request deletion of your data
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Download a copy of your data
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Opt out of marketing communications
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            You can exercise these rights through the Privacy Settings in the App or by contacting us.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Guest Mode
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            You can use Rora Ride without creating an account. In guest mode:
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Ride history is stored locally on your device
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} A temporary device identifier is used
          </Text>
          <Text variant="body" muted style={styles.listItem}>
            {'\u2022'} Limited personal data is collected
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Data Retention
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information as required by law or for legitimate business purposes.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Children's Privacy
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            Our services are not intended for individuals under 18. We do not knowingly collect personal information from children under 18.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Changes to This Policy
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of significant changes through the App or via email. The "Last updated" date indicates when changes were last made.
          </Text>
        </Box>

        <Box style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Contact Us
          </Text>
          <Text variant="body" muted style={styles.paragraph}>
            If you have questions about this Privacy Policy or our data practices, contact us at:
          </Text>
          <Text variant="body" style={styles.contactInfo}>
            privacy@roraride.com
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
  subheading: {
    fontWeight: '600',
    marginTop: space[3],
    marginBottom: space[2],
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
