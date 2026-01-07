import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/ui/components/Button';
import { Card } from '@/src/ui/components/Card';
import { IconButton } from '@/src/ui/components/IconButton';
import { Input } from '@/src/ui/components/Input';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';
import { Ionicons } from '@expo/vector-icons';

type ContactReason = {
  id: string;
  label: string;
  icon: string;
};

const CONTACT_REASONS: ContactReason[] = [
  { id: 'ride', label: 'Issue with a ride', icon: 'car' },
  { id: 'payment', label: 'Payment problem', icon: 'cash' },
  { id: 'driver', label: 'Driver feedback', icon: 'person' },
  { id: 'account', label: 'Account issue', icon: 'settings' },
  { id: 'bug', label: 'Report a bug', icon: 'bug' },
  { id: 'other', label: 'Something else', icon: 'ellipsis-horizontal' },
];

export default function ContactScreen() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Topic', 'Please select what your message is about.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Enter a Message', 'Please describe your issue or feedback.');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleCall = () => {
    Linking.openURL('tel:+17215550199');
  };

  const handleEmail = () => {
    const reason = CONTACT_REASONS.find((r) => r.id === selectedReason)?.label || 'General Inquiry';
    Linking.openURL(`mailto:support@roraride.com?subject=${encodeURIComponent(reason)}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/17215550199');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Contact Us
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Contact Options */}
        <Box style={styles.quickContactSection}>
          <Text variant="body" style={styles.sectionTitle}>
            Get in Touch
          </Text>
          <Box style={styles.quickContactGrid}>
            <Pressable style={styles.quickContactItem} onPress={handleCall}>
              <Box style={[styles.quickContactIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="call" size={24} color={colors.primary} />
              </Box>
              <Text variant="sub" style={styles.quickContactLabel}>
                Call Us
              </Text>
            </Pressable>

            <Pressable style={styles.quickContactItem} onPress={handleEmail}>
              <Box style={[styles.quickContactIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="mail" size={24} color={colors.success} />
              </Box>
              <Text variant="sub" style={styles.quickContactLabel}>
                Email
              </Text>
            </Pressable>

            <Pressable style={styles.quickContactItem} onPress={handleWhatsApp}>
              <Box style={[styles.quickContactIcon, { backgroundColor: '#25D366' + '15' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </Box>
              <Text variant="sub" style={styles.quickContactLabel}>
                WhatsApp
              </Text>
            </Pressable>
          </Box>
        </Box>

        {/* Contact Form */}
        <Box style={styles.formSection}>
          <Text variant="body" style={styles.sectionTitle}>
            Send a Message
          </Text>

          {/* Reason Selection */}
          <Text variant="sub" muted style={styles.fieldLabel}>
            What's this about?
          </Text>
          <Box style={styles.reasonGrid}>
            {CONTACT_REASONS.map((reason) => (
              <Pressable
                key={reason.id}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Ionicons
                  name={reason.icon as any}
                  size={20}
                  color={selectedReason === reason.id ? colors.primary : colors.textMuted}
                />
                <Text
                  variant="sub"
                  style={[
                    styles.reasonLabel,
                    selectedReason === reason.id && styles.reasonLabelSelected,
                  ]}
                >
                  {reason.label}
                </Text>
              </Pressable>
            ))}
          </Box>

          {/* Message Input */}
          <Box style={styles.messageInputWrapper}>
            <Text variant="sub" muted style={styles.fieldLabel}>
              Your Message
            </Text>
            <View style={styles.textAreaContainer}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={colors.textMuted}
                style={styles.textAreaIcon}
              />
              <View style={styles.textAreaInputWrapper}>
                <Input
                  placeholder="Describe your issue or feedback..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  style={styles.textAreaInput}
                />
              </View>
            </View>
          </Box>

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedReason || !message.trim()}
          >
            Send Message
          </Button>
        </Box>

        {/* Business Hours */}
        <Card style={styles.hoursCard}>
          <Box style={styles.hoursHeader}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text variant="body" style={styles.hoursTitle}>
              Support Hours
            </Text>
          </Box>
          <Box style={styles.hoursList}>
            <Box style={styles.hoursRow}>
              <Text variant="sub" muted>
                Monday - Friday
              </Text>
              <Text variant="sub">8:00 AM - 8:00 PM</Text>
            </Box>
            <Box style={styles.hoursRow}>
              <Text variant="sub" muted>
                Saturday
              </Text>
              <Text variant="sub">9:00 AM - 6:00 PM</Text>
            </Box>
            <Box style={styles.hoursRow}>
              <Text variant="sub" muted>
                Sunday
              </Text>
              <Text variant="sub">10:00 AM - 4:00 PM</Text>
            </Box>
          </Box>
          <Text variant="sub" muted style={styles.hoursNote}>
            All times are in Atlantic Standard Time (AST)
          </Text>
        </Card>

        {/* Response Time */}
        <Card style={styles.responseCard}>
          <Ionicons name="flash" size={20} color={colors.warning} />
          <Box style={{ flex: 1 }}>
            <Text variant="body" style={styles.responseTitle}>
              Average Response Time
            </Text>
            <Text variant="sub" muted>
              We typically respond within 2-4 hours during business hours
            </Text>
          </Box>
        </Card>

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
    padding: space[4],
    gap: space[6],
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space[3],
  },
  quickContactSection: {},
  quickContactGrid: {
    flexDirection: 'row',
    gap: space[3],
  },
  quickContactItem: {
    flex: 1,
    alignItems: 'center',
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: space[2],
  },
  quickContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickContactLabel: {
    fontWeight: '500',
  },
  formSection: {
    gap: space[4],
  },
  fieldLabel: {
    marginBottom: space[2],
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  reasonItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reasonLabel: {
    color: colors.textMuted,
  },
  reasonLabelSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  messageInputWrapper: {},
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    padding: space[3],
  },
  textAreaIcon: {
    marginTop: 2,
    marginRight: space[2],
  },
  textAreaInputWrapper: {
    flex: 1,
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  hoursCard: {
    padding: space[4],
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[3],
  },
  hoursTitle: {
    fontWeight: '600',
  },
  hoursList: {
    gap: space[2],
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hoursNote: {
    marginTop: space[3],
    fontSize: 12,
    fontStyle: 'italic',
  },
  responseCard: {
    padding: space[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  responseTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
