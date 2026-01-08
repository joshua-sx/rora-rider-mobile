import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../tokens/colors';
import { space } from '../tokens/spacing';
import { getTabBarHeight } from '@/src/utils/safe-area';

type ScrollBehavior = 'none' | 'scroll' | 'keyboard-aware';

interface ScreenProps {
  /**
   * Screen content
   */
  children: ReactNode;

  /**
   * Scroll behavior:
   * - 'none': No scrolling (fixed content)
   * - 'scroll': Scrollable content
   * - 'keyboard-aware': Scrollable with keyboard avoidance
   * @default 'none'
   */
  scroll?: ScrollBehavior;

  /**
   * Apply standard horizontal padding (space[5] = 20px)
   * @default true
   */
  padded?: boolean;

  /**
   * Apply safe area insets to top
   * @default true
   */
  safeTop?: boolean;

  /**
   * Apply safe area insets to bottom
   * @default false (handled by tab bar usually)
   */
  safeBottom?: boolean;

  /**
   * Account for tab bar height in bottom padding
   * Use this for screens inside tab navigator
   * @default false
   */
  hasTabBar?: boolean;

  /**
   * Additional bottom padding beyond safe area/tab bar
   * @default 0
   */
  extraBottomPadding?: number;

  /**
   * Background color
   * @default colors.surface
   */
  backgroundColor?: string;

  /**
   * Additional container styles
   */
  style?: ViewStyle;

  /**
   * Additional content container styles (for scroll views)
   */
  contentContainerStyle?: ViewStyle;

  /**
   * ScrollView props (when scroll !== 'none')
   */
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
}

/**
 * Screen - Reusable screen wrapper component
 *
 * Handles:
 * - Safe area insets (top and bottom)
 * - Standard horizontal padding
 * - Tab bar spacing
 * - Scroll behavior
 * - Keyboard avoidance
 *
 * @example
 * ```tsx
 * // Simple non-scrolling screen
 * <Screen>
 *   <Text>Hello World</Text>
 * </Screen>
 *
 * // Scrolling screen with tab bar
 * <Screen scroll="scroll" hasTabBar>
 *   <Text>Scrollable content...</Text>
 * </Screen>
 *
 * // Form screen with keyboard avoidance
 * <Screen scroll="keyboard-aware" safeBottom>
 *   <Input />
 *   <Button label="Submit" />
 * </Screen>
 *
 * // Full-bleed screen (no padding, custom background)
 * <Screen padded={false} backgroundColor={colors.surface}>
 *   <MapView />
 * </Screen>
 * ```
 */
export function Screen({
  children,
  scroll = 'none',
  padded = true,
  safeTop = true,
  safeBottom = false,
  hasTabBar = false,
  extraBottomPadding = 0,
  backgroundColor = colors.surface,
  style,
  contentContainerStyle,
  scrollViewProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = hasTabBar ? getTabBarHeight(insets) : 0;

  // Calculate padding
  const paddingTop = safeTop ? insets.top : 0;
  const paddingBottom =
    (safeBottom ? insets.bottom : 0) + tabBarHeight + extraBottomPadding;
  const paddingHorizontal = padded ? space[5] : 0;

  // Base container style
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    ...style,
  };

  // Content style for non-scrolling screens
  const contentStyle: ViewStyle = {
    flex: 1,
    paddingTop,
    paddingBottom,
    paddingHorizontal,
  };

  // Content container style for scrolling screens
  const scrollContentStyle: ViewStyle = {
    paddingTop,
    paddingBottom,
    paddingHorizontal,
    flexGrow: 1,
    ...contentContainerStyle,
  };

  // Non-scrolling screen
  if (scroll === 'none') {
    return (
      <View style={containerStyle}>
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  // Scrolling screen
  const scrollView = (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );

  // Keyboard-aware scrolling screen
  if (scroll === 'keyboard-aware') {
    return (
      <View style={containerStyle}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {scrollView}
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Regular scrolling screen
  return <View style={containerStyle}>{scrollView}</View>;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
});
