import { forwardRef, useState } from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onCancel?: () => void;
  isActive?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  function SearchBar(
    {
      value,
      onChangeText,
      onFocus,
      onCancel,
      isActive = false,
      placeholder = 'Search places, restaurants, beaches...',
      autoFocus = false,
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    
    const textColor = useThemeColor(
      { light: '#262626', dark: '#E5E7EA' },
      'text'
    );
    const placeholderColor = useThemeColor(
      { light: '#5C5F62', dark: '#8B8F95' },
      'textSecondary'
    );
    const iconColor = useThemeColor(
      { light: '#5C5F62', dark: '#8B8F95' },
      'textSecondary'
    );
    const cancelColor = useThemeColor({}, 'tint');
    const inputBackgroundColor = useThemeColor(
      { light: '#FFFFFF', dark: '#1A1A1A' },
      'surface'
    );
    const borderBaseColor = useThemeColor(
      { light: '#E3E6E3', dark: '#2F3237' },
      'border'
    );
    const borderColor = isFocused ? cancelColor : borderBaseColor;

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const handleCancel = () => {
      // Blur the input for proper focus management
      if (typeof ref === 'object' && ref?.current) {
        ref.current.blur();
      }
      onCancel?.();
    };

    return (
      <View style={styles.container}>
        <View 
          style={[
            styles.inputContainer, 
            { 
              backgroundColor: inputBackgroundColor,
              borderColor: borderColor,
              borderWidth: isFocused ? 2 : 1,
            }
          ]}
        >
          <Ionicons name="search" size={18} color={iconColor} style={styles.icon} />
          <TextInput
            ref={ref}
            style={[styles.input, { color: textColor }]}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus={autoFocus}
            returnKeyType="search"
          />
          {value && value.length > 0 && (
            <Pressable onPress={() => onChangeText?.('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={iconColor} />
            </Pressable>
          )}
        </View>

        {isActive && (
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <ThemedText style={[styles.cancelText, { color: cancelColor }]}>
              Cancel
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Fonts?.sans,
    padding: 0,
    margin: 0,
  },
  cancelButton: {
    marginLeft: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
