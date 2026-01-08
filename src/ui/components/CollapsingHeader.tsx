import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../primitives/Text';
import { Pressable } from '../primitives/Pressable';
import { colors } from '../tokens/colors';
import { space } from '../tokens/spacing';
import { type } from '../tokens/typography';

/**
 * CollapsingHeader
 *
 * A header component that collapses from a large title to inline title on scroll.
 * Used with ListScreenTemplate or custom scroll implementations.
 *
 * Features:
 * - Large title that fades out on scroll
 * - Inline title that fades in when collapsed
 * - Optional back button
 * - Optional right action
 * - Smooth animated transitions
 */

const HEADER_HEIGHT = 44;
const COLLAPSE_THRESHOLD = 56; // When to fully collapse

type Props = {
  /** Screen title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Scroll position shared value */
  scrollY: SharedValue<number>;
  /** Show back button */
  showBackButton?: boolean;
  /** Back button handler */
  onBackPress?: () => void;
  /** Right side content */
  rightContent?: ReactNode;
  /** Background color when collapsed */
  backgroundColor?: string;
};

export function CollapsingHeader({
  title,
  subtitle,
  scrollY,
  showBackButton = false,
  onBackPress,
  rightContent,
  backgroundColor = colors.surface,
}: Props) {
  const insets = useSafeAreaInsets();

  // Large title animation (fades and moves up)
  const largeTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD * 0.7],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [0, -20],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  }, []);

  // Inline title animation (fades in)
  const inlineTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD * 0.5, COLLAPSE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  }, []);

  // Header background animation (appears when collapsed)
  const headerBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [COLLAPSE_THRESHOLD * 0.7, COLLAPSE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      backgroundColor,
    };
  }, [backgroundColor]);

  return (
    <>
      {/* Fixed Header Bar */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]}>
        {/* Animated background */}
        <Animated.View style={[styles.headerBg, headerBgStyle]} />

        {/* Header content */}
        <View style={styles.headerContent}>
          {/* Back button */}
          {showBackButton && (
            <Pressable
              onPress={onBackPress}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
          )}

          {/* Inline title (visible when collapsed) */}
          <Animated.View style={[styles.inlineTitleContainer, inlineTitleStyle]}>
            <Text style={styles.inlineTitle} numberOfLines={1}>
              {title}
            </Text>
          </Animated.View>

          {/* Right content */}
          <View style={styles.rightContainer}>{rightContent}</View>
        </View>
      </View>

      {/* Large Title Section (scrolls with content) */}
      <Animated.View style={[styles.largeTitleContainer, largeTitleStyle]}>
        <Text style={styles.largeTitle}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>
    </>
  );
}

/**
 * Hook to get the total header offset for content padding
 */
export function useCollapsingHeaderOffset() {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_HEIGHT;
}

const styles = StyleSheet.create({
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: space[2],
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  inlineTitle: {
    ...type.headline,
    color: colors.text,
  },
  rightContainer: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  largeTitleContainer: {
    paddingHorizontal: space[4],
    paddingTop: space[6],
    paddingBottom: space[4],
  },
  largeTitle: {
    ...type.title1,
    color: colors.text,
  },
  subtitle: {
    ...type.body,
    color: colors.textMuted,
    marginTop: space[1],
  },
});
