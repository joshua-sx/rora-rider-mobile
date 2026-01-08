import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

type ContactMethod = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  action: () => void;
};

export default function ContactUsScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:support@roraride.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+17215550000');
  };

  const handleWhatsApp = async () => {
    const whatsappUrl = 'whatsapp://send?phone=17215550000';
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      Alert.alert(
        'WhatsApp Not Available',
        'WhatsApp is not installed on your device. Please install WhatsApp to send us a message.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleInstagram = () => {
    Linking.openURL('instagram://user?username=roraride').catch(() => {
      Linking.openURL('https://instagram.com/roraride');
    });
  };

  const contactMethods: ContactMethod[] = [
    {
      icon: 'mail-outline',
      label: 'Email Us',
      value: 'support@roraride.com',
      action: handleEmail,
    },
    {
      icon: 'call-outline',
      label: 'Call Us',
      value: '+1 (721) 555-RORA',
      action: handlePhone,
    },
    {
      icon: 'logo-whatsapp',
      label: 'WhatsApp',
      value: 'Message us',
      action: handleWhatsApp,
    },
    {
      icon: 'logo-instagram',
      label: 'Instagram',
      value: '@roraride',
      action: handleInstagram,
    },
  ];

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
          Contact Us
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text variant="body" style={styles.sectionTitle}>
          GET IN TOUCH
        </Text>

        {contactMethods.map((method, index) => (
          <Pressable key={method.label} onPress={method.action}>
            <Card style={[styles.contactCard, index === contactMethods.length - 1 && styles.lastCard]}>
              <Box style={styles.iconContainer}>
                <Ionicons name={method.icon} size={24} color={colors.primary} />
              </Box>
              <Box style={styles.contactInfo}>
                <Text variant="body" style={styles.contactLabel}>
                  {method.label}
                </Text>
                <Text variant="sub" style={styles.contactValue}>
                  {method.value}
                </Text>
              </Box>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Card>
          </Pressable>
        ))}

        <Card style={styles.hoursCard}>
          <Text variant="body" style={styles.hoursTitle}>
            OFFICE HOURS
          </Text>
          <Box style={styles.hoursContent}>
            <Text variant="body" style={styles.hoursText}>
              Monday - Friday: 8AM - 8PM
            </Text>
            <Text variant="body" style={styles.hoursText}>
              Saturday - Sunday: 9AM - 6PM
            </Text>
          </Box>
          <Text variant="sub" style={styles.hoursNote}>
            Atlantic Standard Time (AST)
          </Text>
        </Card>
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
  sectionTitle: {
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space[3],
    letterSpacing: 0.5,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space[4],
    gap: space[3],
    marginBottom: space[3],
  },
  lastCard: {
    marginBottom: space[6],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: space[1],
  },
  contactLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  contactValue: {
    color: colors.textMuted,
  },
  hoursCard: {
    padding: space[4],
    gap: space[3],
  },
  hoursTitle: {
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  hoursContent: {
    gap: space[2],
  },
  hoursText: {
    color: colors.text,
  },
  hoursNote: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
