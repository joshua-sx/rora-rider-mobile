import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/src/ui/components/themed-text';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import type { CategoryInfo } from '@/src/types/venue';

type CategoryChipProps = {
  category: CategoryInfo;
  isActive?: boolean;
  onPress?: (category: CategoryInfo) => void;
};

export function CategoryChip({
  category,
  isActive = false,
  onPress,
}: CategoryChipProps) {
  const backgroundColor = useThemeColor(
    { light: '#EEF3ED', dark: '#1F1F1F' },
    'background'
  );
  const activeBackgroundColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor(
    { light: '#262626', dark: '#E5E7EA' },
    'text'
  );
  const activeTextColor = '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isActive ? activeBackgroundColor : backgroundColor,
        },
        pressed && styles.pressed,
      ]}
      onPress={() => onPress?.(category)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : category.color + '20' },
        ]}
      >
        <Ionicons
          name={category.icon as any}
          size={18}
          color={isActive ? activeTextColor : category.color}
        />
      </View>
      <ThemedText
        style={[
          styles.label,
          { color: isActive ? activeTextColor : textColor },
        ]}
      >
        {category.name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    marginRight: 10,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
