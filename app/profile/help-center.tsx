import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { Divider } from '@/src/ui/components/Divider';
import { IconButton } from '@/src/ui/components/IconButton';
import { ListItem } from '@/src/ui/components/ListItem';
import { SearchInput } from '@/src/ui/components/SearchInput';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'How do I request a ride?',
    answer: 'To request a ride, tap the "Where to?" button on the home screen, enter your destination, and select a driver from the available options. You can also scan a driver\'s QR code directly.',
    category: 'Getting Started',
  },
  {
    id: '2',
    question: 'What payment methods are accepted?',
    answer: 'Currently, Rora Ride operates on a cash-first basis. You pay your driver directly at the end of the ride. Both USD and ANG are accepted. Card payments may be added in the future.',
    category: 'Payments',
  },
  {
    id: '3',
    question: 'How are fares calculated?',
    answer: 'Fares are calculated based on distance and follow the standard taxi rates established in Sint Maarten. You\'ll see an estimated fare before confirming your ride.',
    category: 'Payments',
  },
  {
    id: '4',
    question: 'Can I use Rora without an account?',
    answer: 'Yes! You can use Rora in guest mode without creating an account. Your ride history will be stored locally on your device. Creating an account lets you access your history from any device.',
    category: 'Account',
  },
  {
    id: '5',
    question: 'How do I contact my driver?',
    answer: 'Once you\'ve connected with a driver, you can call or message them directly through the app. Their contact information will be visible on your ride screen.',
    category: 'During Ride',
  },
  {
    id: '6',
    question: 'What is the QR code system?',
    answer: 'The QR code system provides a secure way to connect with drivers. When you scan a driver\'s QR code or they scan yours, it creates a verified session for your ride.',
    category: 'Safety',
  },
  {
    id: '7',
    question: 'How do I report a problem with my ride?',
    answer: 'Go to your ride history, select the ride in question, and tap "Report an Issue." You can also contact our support team directly through the Contact Us section.',
    category: 'Support',
  },
  {
    id: '8',
    question: 'Can I save favorite drivers?',
    answer: 'Yes! You can star drivers you like to add them to your favorites. Find them quickly in the Favorite Drivers section of your profile.',
    category: 'Features',
  },
  {
    id: '9',
    question: 'How do I save my home and work addresses?',
    answer: 'Go to Profile > Saved Locations. You can add your home, work, and other frequently visited places for quick access when booking rides.',
    category: 'Features',
  },
  {
    id: '10',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take your privacy seriously. Your personal data is encrypted and stored securely. We never share your information with third parties without your consent.',
    category: 'Safety',
  },
];

const QUICK_HELP_TOPICS = [
  { id: 'ride', icon: 'car', label: 'Ride Issues', color: colors.primary },
  { id: 'payment', icon: 'cash', label: 'Payments', color: colors.success },
  { id: 'account', icon: 'person', label: 'Account', color: colors.warning },
  { id: 'safety', icon: 'shield-checkmark', label: 'Safety', color: colors.danger },
];

export default function HelpCenterScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = searchQuery
    ? FAQ_DATA.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQ_DATA;

  const handleContactSupport = () => {
    router.push('/profile/contact');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@roraride.com?subject=Support%20Request');
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Help Center
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <Box style={styles.searchSection}>
          <Text variant="h2" style={styles.searchTitle}>
            How can we help?
          </Text>
          <SearchInput
            placeholder="Search for help..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Box>

        {/* Quick Help Topics */}
        {!searchQuery && (
          <Box style={styles.quickHelpSection}>
            <Text variant="body" style={styles.sectionTitle}>
              Quick Help
            </Text>
            <Box style={styles.quickHelpGrid}>
              {QUICK_HELP_TOPICS.map((topic) => (
                <Pressable
                  key={topic.id}
                  style={styles.quickHelpItem}
                  onPress={() => setSearchQuery(topic.label)}
                >
                  <Box style={[styles.quickHelpIcon, { backgroundColor: topic.color + '15' }]}>
                    <Ionicons name={topic.icon as any} size={24} color={topic.color} />
                  </Box>
                  <Text variant="sub" style={styles.quickHelpLabel}>
                    {topic.label}
                  </Text>
                </Pressable>
              ))}
            </Box>
          </Box>
        )}

        {/* FAQs */}
        <Box style={styles.faqSection}>
          <Text variant="body" style={styles.sectionTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : 'Frequently Asked Questions'}
          </Text>

          {filteredFaqs.length === 0 ? (
            <Card style={styles.noResultsCard}>
              <Ionicons name="search" size={32} color={colors.textMuted} />
              <Text variant="body" style={styles.noResultsText}>
                No results found
              </Text>
              <Text variant="sub" muted style={{ textAlign: 'center' }}>
                Try a different search term or browse the categories above
              </Text>
            </Card>
          ) : (
            filteredFaqs.map((faq, index) => (
              <React.Fragment key={faq.id}>
                <Pressable onPress={() => toggleFaq(faq.id)}>
                  <Card style={styles.faqCard}>
                    <Box style={styles.faqHeader}>
                      <Box style={{ flex: 1 }}>
                        <Text variant="sub" style={styles.faqCategory}>
                          {faq.category}
                        </Text>
                        <Text variant="body" style={styles.faqQuestion}>
                          {faq.question}
                        </Text>
                      </Box>
                      <Ionicons
                        name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </Box>
                    {expandedFaq === faq.id && (
                      <>
                        <Divider style={{ marginVertical: space[3] }} />
                        <Text variant="body" muted style={styles.faqAnswer}>
                          {faq.answer}
                        </Text>
                      </>
                    )}
                  </Card>
                </Pressable>
                {index < filteredFaqs.length - 1 && <View style={{ height: space[3] }} />}
              </React.Fragment>
            ))
          )}
        </Box>

        {/* Contact Options */}
        <Box style={styles.contactSection}>
          <Text variant="body" style={styles.sectionTitle}>
            Still need help?
          </Text>

          <ListItem
            title="Contact Support"
            subtitle="Send us a message"
            onPress={handleContactSupport}
            leading={
              <Box style={styles.contactIcon}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
              </Box>
            }
          />
          <Divider />
          <ListItem
            title="Email Us"
            subtitle="support@roraride.com"
            onPress={handleEmailSupport}
            leading={
              <Box style={styles.contactIcon}>
                <Ionicons name="mail" size={20} color={colors.primary} />
              </Box>
            }
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
    padding: space[4],
  },
  searchSection: {
    marginBottom: space[6],
    gap: space[3],
  },
  searchTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: space[3],
  },
  quickHelpSection: {
    marginBottom: space[6],
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  quickHelpItem: {
    width: '47%',
    alignItems: 'center',
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: space[2],
  },
  quickHelpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickHelpLabel: {
    fontWeight: '500',
    textAlign: 'center',
  },
  faqSection: {
    marginBottom: space[6],
  },
  faqCard: {
    padding: space[4],
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  faqCategory: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
  },
  faqQuestion: {
    fontWeight: '500',
  },
  faqAnswer: {
    lineHeight: 22,
  },
  noResultsCard: {
    padding: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  noResultsText: {
    fontWeight: '600',
  },
  contactSection: {
    marginBottom: space[4],
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
