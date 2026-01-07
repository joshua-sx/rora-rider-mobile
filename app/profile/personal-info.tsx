import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/ui/components/Button';
import { IconButton } from '@/src/ui/components/IconButton';
import { Input } from '@/src/ui/components/Input';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

export default function PersonalInfoScreen() {
  // Form state - would typically come from a user store/auth context
  const [firstName, setFirstName] = useState('Joshua');
  const [lastName, setLastName] = useState('Bowers');
  const [email, setEmail] = useState('joshua@example.com');
  const [phone, setPhone] = useState('+1 (721) 555-0123');
  const [isLoading, setIsLoading] = useState(false);

  // Track if form has been modified
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setHasChanges(false);
    Alert.alert('Success', 'Your profile has been updated.');
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert('Discard Changes', 'Are you sure you want to discard your changes?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Personal Information
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <Box style={styles.avatarSection}>
          <Box style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </Box>
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => Alert.alert('Change Photo', 'Photo upload coming soon')}
          >
            Change Photo
          </Button>
        </Box>

        {/* Form Fields */}
        <Box style={styles.formSection}>
          <Input
            label="First Name"
            value={firstName}
            onChangeText={handleChange(setFirstName)}
            placeholder="Enter your first name"
            autoCapitalize="words"
            left={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Last Name"
            value={lastName}
            onChangeText={handleChange(setLastName)}
            placeholder="Enter your last name"
            autoCapitalize="words"
            left={<Ionicons name="person-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={handleChange(setEmail)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={handleChange(setPhone)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            left={<Ionicons name="call-outline" size={20} color={colors.textMuted} />}
          />
        </Box>

        {/* Email Verification Notice */}
        <Box style={styles.noticeCard}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text variant="sub" style={styles.noticeText}>
            Email verified
          </Text>
        </Box>

        {/* Phone Verification Notice */}
        <Box style={styles.noticeCard}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text variant="sub" style={styles.noticeText}>
            Phone verified
          </Text>
        </Box>

        {/* Delete Account */}
        <Box style={styles.dangerSection}>
          <Button
            variant="tertiary"
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]
              );
            }}
          >
            <Text variant="body" style={{ color: colors.danger }}>
              Delete Account
            </Text>
          </Button>
        </Box>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <Box style={styles.footer}>
          <Button variant="primary" onPress={handleSave} loading={isLoading}>
            Save Changes
          </Button>
        </Box>
      )}
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: space[4],
    gap: space[3],
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    gap: space[4],
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  noticeText: {
    color: colors.textMuted,
  },
  dangerSection: {
    marginTop: space[4],
    paddingTop: space[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footer: {
    padding: space[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
