import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'pa', name: 'Papiamento', nativeName: 'Papiamentu', flag: '🇨🇼' },
];

export default function LanguageScreen() {
  // Would typically come from a settings store
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    // In a real app, this would update the i18n configuration
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Language
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <Card style={styles.infoBanner}>
          <Box style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text variant="sub" muted style={{ flex: 1 }}>
              Select your preferred language. The app will be translated where available.
            </Text>
          </Box>
        </Card>

        {/* Language List */}
        <Box style={styles.languageList}>
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              onPress={() => handleSelectLanguage(language.code)}
            >
              <Card
                style={[
                  styles.languageCard,
                  selectedLanguage === language.code && styles.languageCardSelected,
                ]}
              >
                <Box style={styles.languageContent}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Box style={{ flex: 1 }}>
                    <Text variant="body" style={styles.languageName}>
                      {language.name}
                    </Text>
                    <Text variant="sub" muted>
                      {language.nativeName}
                    </Text>
                  </Box>
                  {selectedLanguage === language.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Box>
              </Card>
            </Pressable>
          ))}
        </Box>

        {/* Note */}
        <Box style={styles.noteSection}>
          <Text variant="sub" muted style={styles.noteText}>
            Sint Maarten is a multilingual island. Rora Ride supports the most commonly spoken languages in the region to better serve all residents and visitors.
          </Text>
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
  infoBanner: {
    padding: space[4],
    marginBottom: space[4],
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  languageList: {
    gap: space[3],
  },
  languageCard: {
    padding: space[4],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  languageFlag: {
    fontSize: 32,
  },
  languageName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  noteSection: {
    marginTop: space[6],
    padding: space[4],
  },
  noteText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
