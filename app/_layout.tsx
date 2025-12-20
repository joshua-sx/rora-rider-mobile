import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ToastProvider } from '@/src/ui/providers/ToastProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const headerBackgroundColor = useThemeColor({}, 'surface');
  const headerTitleColor = useThemeColor({}, 'text');
  const headerTintColor = useThemeColor({}, 'tint');

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: headerBackgroundColor },
              headerTintColor,
              headerTitleStyle: { fontWeight: '600', color: headerTitleColor },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen
              name="route-input"
              options={{
                presentation: 'card',
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="trip-preview"
              options={{
                presentation: 'card',
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
