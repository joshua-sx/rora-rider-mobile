import { Pressable, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SearchInput as DSSearchInput } from '@/src/ui';
import { colors } from '@/src/ui/tokens/colors';

type SearchInputProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
} & Omit<TextInputProps, 'style'>;

/**
 * SearchInput - Wraps design system SearchInput for backward compatibility
 * Can be used as a pressable search trigger or an editable input
 */
export function SearchInput({
  placeholder = 'Search destination',
  value,
  onChangeText,
  onPress,
  editable = true,
  ...props
}: SearchInputProps) {
  const leftIcon = <Ionicons name="search" size={20} color={colors.textMuted} />;

  const content = (
    <DSSearchInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      editable={editable && !onPress}
      leftIcon={leftIcon}
      {...props}
    />
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}
