import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

export default function PaymentMethodsScreen() {
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
          Payment Methods
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.infoCard}>
          <Box style={styles.iconContainer}>
            <Ionicons name="cash-outline" size={48} color={colors.primary} />
          </Box>

          <Text variant="h2" style={styles.title}>
            Cash Payments Only
          </Text>

          <Text variant="body" style={styles.description}>
            Rora currently accepts cash payments. Digital payment options coming soon.
          </Text>

          <Box style={styles.divider} />

          <Box style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text variant="body" style={styles.infoText}>
              Pay your driver directly in cash
            </Text>
          </Box>

          <Box style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text variant="body" style={styles.infoText}>
              Payment at the end of each ride
            </Text>
          </Box>

          <Box style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text variant="body" style={styles.infoText}>
              Exact change appreciated but not required
            </Text>
          </Box>
        </Card>

        <Box style={styles.futureNote}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text variant="sub" style={styles.futureNoteText}>
            We're working on adding credit card and digital wallet support in a future update.
          </Text>
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
    padding: space[4],
  },
  infoCard: {
    padding: space[6],
    alignItems: 'center',
    gap: space[4],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[2],
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  description: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    alignSelf: 'stretch',
  },
  infoText: {
    flex: 1,
    color: colors.text,
  },
  futureNote: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[4],
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  futureNoteText: {
    flex: 1,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
