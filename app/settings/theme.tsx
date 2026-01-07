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

type ThemeOption = {
  id: 'light' | 'dark' | 'auto';
  name: string;
  description: string;
  icon: string;
  colors: {
    bg: string;
    surface: string;
    text: string;
  };
};

const THEMES: ThemeOption[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Always use light mode',
    icon: 'sunny',
    colors: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1A1A1A',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Always use dark mode',
    icon: 'moon',
    colors: {
      bg: '#1A1A1A',
      surface: '#2D2D2D',
      text: '#FFFFFF',
    },
  },
  {
    id: 'auto',
    name: 'System',
    description: 'Follow system settings',
    icon: 'phone-portrait',
    colors: {
      bg: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1A1A1A',
    },
  },
];

export default function ThemeScreen() {
  // Would typically come from a settings store
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  const handleSelectTheme = (id: 'light' | 'dark' | 'auto') => {
    setSelectedTheme(id);
    // In a real app, this would update the color scheme context
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Theme
        </Text>
        <View style={{ width: 40 }} />
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Theme Options */}
        <Box style={styles.themeList}>
          {THEMES.map((theme) => (
            <Pressable
              key={theme.id}
              onPress={() => handleSelectTheme(theme.id)}
            >
              <Card
                style={[
                  styles.themeCard,
                  selectedTheme === theme.id && styles.themeCardSelected,
                ]}
              >
                <Box style={styles.themeContent}>
                  {/* Theme Preview */}
                  <Box
                    style={[
                      styles.themePreview,
                      { backgroundColor: theme.colors.bg },
                    ]}
                  >
                    <Box
                      style={[
                        styles.previewHeader,
                        { backgroundColor: theme.colors.surface },
                      ]}
                    />
                    <Box style={styles.previewContent}>
                      <Box
                        style={[
                          styles.previewLine,
                          { backgroundColor: theme.colors.text, opacity: 0.7 },
                        ]}
                      />
                      <Box
                        style={[
                          styles.previewLine,
                          styles.previewLineShort,
                          { backgroundColor: theme.colors.text, opacity: 0.4 },
                        ]}
                      />
                    </Box>
                    <Box
                      style={[
                        styles.previewButton,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  </Box>

                  {/* Theme Info */}
                  <Box style={styles.themeInfo}>
                    <Box style={styles.themeIconContainer}>
                      <Ionicons
                        name={theme.icon as any}
                        size={24}
                        color={selectedTheme === theme.id ? colors.primary : colors.textMuted}
                      />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text
                        variant="body"
                        style={[
                          styles.themeName,
                          selectedTheme === theme.id && styles.themeNameSelected,
                        ]}
                      >
                        {theme.name}
                      </Text>
                      <Text variant="sub" muted>
                        {theme.description}
                      </Text>
                    </Box>
                    {selectedTheme === theme.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </Box>
                </Box>
              </Card>
            </Pressable>
          ))}
        </Box>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Box style={styles.infoContent}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text variant="sub" muted style={{ flex: 1 }}>
              The System option automatically switches between light and dark mode based on your device settings.
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
  },
  themeList: {
    gap: space[4],
  },
  themeCard: {
    padding: space[4],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: colors.primary,
  },
  themeContent: {
    gap: space[4],
  },
  themePreview: {
    height: 120,
    borderRadius: 8,
    padding: space[2],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewHeader: {
    height: 20,
    borderRadius: 4,
    marginBottom: space[2],
  },
  previewContent: {
    flex: 1,
    gap: space[2],
    paddingHorizontal: space[1],
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
  },
  previewLineShort: {
    width: '60%',
  },
  previewButton: {
    height: 24,
    borderRadius: 12,
    marginTop: 'auto',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  themeNameSelected: {
    color: colors.primary,
  },
  infoCard: {
    marginTop: space[6],
    padding: space[4],
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
});
