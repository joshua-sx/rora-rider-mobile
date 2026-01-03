import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SearchInput } from '@/src/ui';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onCancel?: () => void;
  isActive?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * SearchBar - Wraps design system SearchInput with cancel button
 * Used in Explore screen for search with cancel action
 */
export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onCancel,
  isActive = false,
  placeholder = 'Search places, restaurants, beaches...',
  autoFocus = false,
}: SearchBarProps) {
  const handleCancel = () => {
    onCancel?.();
  };

  const leftIcon = <Ionicons name="search" size={18} color={colors.textMuted} />;

  const rightIcon =
    value && value.length > 0 ? (
      <Pressable onPress={() => onChangeText?.('')} hitSlop={8}>
        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
      </Pressable>
    ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <SearchInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          autoFocus={autoFocus}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
        />
      </View>

      {isActive && (
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <Text style={{ color: colors.primary, fontWeight: '500' }}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  inputContainer: {
    flex: 1,
  },
  cancelButton: {
    paddingVertical: space[2],
  },
});
