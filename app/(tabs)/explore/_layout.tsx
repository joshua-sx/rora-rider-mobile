import { Stack } from 'expo-router';

import { useThemeColor } from '@/src/hooks/use-theme-color';

export default function ExploreLayout() {
  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="category/[slug]" />
      <Stack.Screen name="venue/[id]" />
    </Stack>
  );
}


