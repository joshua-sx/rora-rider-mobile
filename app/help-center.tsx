import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccordionItem } from '@/src/ui/components/AccordionItem';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

type FAQ = {
  question: string;
  answer: string;
};

type FAQCategory = {
  title: string;
  faqs: FAQ[];
};

const FAQ_DATA: FAQCategory[] = [
  {
    title: 'Getting Started',
    faqs: [
      {
        question: 'How do I book a ride?',
        answer:
          'Enter your pickup and destination locations on the home screen, review your fare estimate, then scan the driver\'s QR code to start your ride. You can also save trips for quick booking later.',
      },
      {
        question: 'How do I find verified drivers?',
        answer:
          'Browse the Drivers tab to see all verified taxi operators. Each driver profile shows their rating, vehicle information, and verification status. You can also favorite drivers for quick access.',
      },
      {
        question: 'What is QR code matching?',
        answer:
          'QR code matching is Rora\'s unique safety feature. Each ride generates a unique QR code that you scan from the driver\'s device. This ensures you\'re getting into the right vehicle and creates a verified record of your trip.',
      },
    ],
  },
  {
    title: 'Payments',
    faqs: [
      {
        question: 'How do I pay for my ride?',
        answer:
          'Rora currently accepts cash payments only. Pay your driver directly at the end of your ride. We\'re working on adding digital payment options in the future.',
      },
      {
        question: 'Can I get a receipt?',
        answer:
          'Yes! Your ride history in the Activity tab contains all trip details including pickup, destination, distance, and fare. You can view or share this information as a receipt.',
      },
      {
        question: 'Are prices negotiable?',
        answer:
          'Rora provides transparent fare estimates upfront based on distance and time. While final prices can be discussed with your driver (especially for cash payments), we recommend using the estimated fare as a fair starting point.',
      },
    ],
  },
  {
    title: 'Safety',
    faqs: [
      {
        question: 'How are drivers verified?',
        answer:
          'All Rora drivers are licensed, verified taxi operators in Sint Maarten. Each driver undergoes background checks, vehicle inspections, and must maintain proper insurance and licensing.',
      },
      {
        question: 'What if I have a safety concern?',
        answer:
          'Your safety is our priority. If you have any concerns during or after a ride, contact us immediately through the Contact Us screen. You can also share your ride details with trusted contacts before starting your trip.',
      },
      {
        question: 'Can I share my ride with friends?',
        answer:
          'Yes! You can share your ride details including driver information, vehicle details, and estimated arrival time with friends or family for added safety and peace of mind.',
      },
    ],
  },
  {
    title: 'General',
    faqs: [
      {
        question: 'How do I contact support?',
        answer:
          'Visit the Contact Us screen from your Profile for multiple ways to reach us: email, phone, WhatsApp, or Instagram. Our support team is available during office hours Monday-Sunday.',
      },
      {
        question: 'Where does Rora operate?',
        answer:
          'Rora currently operates throughout Sint Maarten, connecting riders with verified local taxi operators. We\'re continuously expanding our coverage across the island.',
      },
      {
        question: 'How do I save favorite locations?',
        answer:
          'Save frequent destinations (like home or work) from the Saved Locations screen in your Profile. These will appear as quick options when planning routes, making booking faster and easier.',
      },
    ],
  },
];

export default function HelpCenterScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
          Help Center
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      {/* Search Bar (Visual Only) */}
      <Box style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for help..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={false}
        />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {FAQ_DATA.map((category, categoryIndex) => (
          <Box key={category.title} style={styles.categorySection}>
            <Text variant="body" style={styles.categoryTitle}>
              {category.title.toUpperCase()}
            </Text>
            <Box style={styles.faqList}>
              {category.faqs.map((faq, faqIndex) => {
                const id = `${categoryIndex}-${faqIndex}`;
                return (
                  <AccordionItem
                    key={id}
                    question={faq.question}
                    answer={faq.answer}
                    isExpanded={expandedId === id}
                    onToggle={() => handleToggle(id)}
                  />
                );
              })}
            </Box>
          </Box>
        ))}

        <Box style={styles.footerNote}>
          <Ionicons name="help-circle-outline" size={20} color={colors.textMuted} />
          <Text variant="sub" style={styles.footerText}>
            Can't find what you're looking for? Contact our support team for personalized assistance.
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: space[4],
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: space[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space[6],
  },
  categorySection: {
    marginBottom: space[6],
  },
  categoryTitle: {
    fontWeight: '600',
    color: colors.textMuted,
    paddingHorizontal: space[4],
    marginBottom: space[3],
    letterSpacing: 0.5,
  },
  faqList: {
    backgroundColor: colors.surface,
  },
  footerNote: {
    flexDirection: 'row',
    gap: space[2],
    marginHorizontal: space[4],
    marginTop: space[4],
    padding: space[3],
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: {
    flex: 1,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
