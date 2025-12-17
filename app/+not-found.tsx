import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function NotFoundScreen() {
  const tint = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Not Found</ThemedText>
        <ThemedText style={styles.subtitle}>
          The page you’re looking for doesn’t exist.
        </ThemedText>

        <Link href="/" style={[styles.link, { borderColor: tint }]}>
          <ThemedText style={[styles.linkText, { color: tint }]}>Go to Home</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.75,
  },
  link: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  linkText: {
    fontWeight: '600',
  },
});


