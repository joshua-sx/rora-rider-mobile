import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarHeight } from '@/src/utils/safe-area';

/**
 * Hook for managing sticky CTA card positioning and ScrollView padding.
 *
 * Prevents tab bar overlap by correctly calculating:
 * 1. Card bottom position (accounts for tab bar + safe area)
 * 2. ScrollView content padding (accounts for card height + tab bar + buffer)
 *
 * **Usage:**
 * ```tsx
 * const { cardBottomPosition, scrollViewPadding } = useStickyCta(cardHeight);
 *
 * // In card component:
 * <View style={[styles.card, { bottom: cardBottomPosition }]} />
 *
 * // In ScrollView:
 * <ScrollView contentContainerStyle={{ paddingBottom: scrollViewPadding }} />
 * ```
 *
 * **Design Reference:**
 * - UX_WIREFRAME_AUDIT.md:147 - Tab bar overlap issue
 * - Issue #189 - Fix double-add safe area bug
 *
 * @param cardHeight - Total height of the sticky CTA card (content + padding)
 * @returns Object with cardBottomPosition and scrollViewPadding values
 */
export function useStickyCta(cardHeight: number) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);

  // Buffer space between ScrollView content and card
  const BUFFER = 16;

  /**
   * Position card above the tab bar.
   * getTabBarHeight already includes insets.bottom, so we don't add it again.
   */
  const cardBottomPosition = tabBarHeight;

  /**
   * ScrollView padding must account for:
   * - Tab bar height (includes safe area insets)
   * - Card height (entire card)
   * - Buffer space (visual breathing room)
   */
  const scrollViewPadding = tabBarHeight + cardHeight + BUFFER;

  return {
    cardBottomPosition,
    scrollViewPadding,
  };
}
