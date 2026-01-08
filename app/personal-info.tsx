import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/ui/components/Button';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

export default function PersonalInfoScreen() {
  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Edit functionality coming soon. You will be able to update your personal information here.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Personal Information
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <Box style={styles.avatarSection}>
          <Box style={styles.avatar}>
            <Ionicons name="person" size={56} color={colors.primary} />
          </Box>
        </Box>

        {/* Info Fields */}
        <Box style={styles.infoSection}>
          <Box style={styles.infoField}>
            <Text variant="sub" style={styles.fieldLabel}>
              FULL NAME
            </Text>
            <Text variant="body" style={styles.fieldValue}>
              Joshua Bowers
            </Text>
          </Box>

          <Box style={styles.infoField}>
            <Text variant="sub" style={styles.fieldLabel}>
              EMAIL ADDRESS
            </Text>
            <Text variant="body" style={styles.fieldValue}>
              joshua@example.com
            </Text>
          </Box>

          <Box style={styles.infoField}>
            <Text variant="sub" style={styles.fieldLabel}>
              PHONE NUMBER
            </Text>
            <Text variant="body" style={styles.fieldValue}>
              +1 (721) 555-0123
            </Text>
          </Box>
        </Box>

        {/* Edit Button */}
        <Box style={styles.buttonSection}>
          <Button
            label="Edit Profile"
            onPress={handleEditProfile}
            variant="primary"
          />
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    paddingVertical: space[6],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: space[8],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    gap: space[6],
    paddingHorizontal: space[4],
    marginBottom: space[8],
  },
  infoField: {
    gap: space[2],
  },
  fieldLabel: {
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 17,
    color: colors.text,
  },
  buttonSection: {
    paddingHorizontal: space[4],
  },
});
