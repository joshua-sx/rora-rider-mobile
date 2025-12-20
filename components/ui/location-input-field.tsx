import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Pressable,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Input } from '@/src/ui';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

type LocationInputFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onFocus?: () => void;
  onClear?: () => void;
  isLocked?: boolean;
  isFocused?: boolean;
  autoFocus?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
} & Omit<TextInputProps, 'style'>;

/**
 * LocationInputField - Wraps design system Input with location-specific UX
 * Unique features: locked state with checkmark, optional right icon button
 */

export const LocationInputField = forwardRef<TextInput, LocationInputFieldProps>(
  function LocationInputField(
    {
      label,
      value,
      placeholder,
      onChangeText,
      onPress,
      onFocus,
      onClear,
      isLocked = false,
      isFocused = false,
      autoFocus = false,
      iconName,
      rightIcon,
      onRightIconPress,
      ...textInputProps
    },
    ref
  ) {
    const displayIcon = iconName || (isLocked ? 'location' : 'search');

    const leftIcon = (
      <Ionicons
        name={displayIcon}
        size={18}
        color={isLocked ? colors.primary : colors.textMuted}
      />
    );

    const rightContent = isLocked ? (
      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
    ) : value && value.length > 0 && onClear && !onPress ? (
      <Pressable onPress={onClear} hitSlop={8}>
        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
      </Pressable>
    ) : null;

    const content = (
      <View style={styles.container}>
        <View style={styles.rowContainer}>
          <View style={styles.inputWrapper}>
            <Input
              label={label}
              value={isLocked ? (value || 'Current location') : value}
              placeholder={placeholder}
              onChangeText={onChangeText}
              onFocus={onFocus}
              autoFocus={autoFocus}
              editable={!onPress && !isLocked}
              left={leftIcon}
              right={rightContent}
              {...textInputProps}
            />
          </View>
          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIconButton}
              hitSlop={8}
              disabled={!onRightIconPress}
            >
              <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
    );

    if (onPress && !isLocked) {
      return (
        <Pressable onPress={onPress} style={styles.pressable}>
          {content}
        </Pressable>
      );
    }

    return content;
  }
);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  container: {
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  inputWrapper: {
    flex: 1,
  },
  rightIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24, // Align with input field (label height + gap)
  },
});
