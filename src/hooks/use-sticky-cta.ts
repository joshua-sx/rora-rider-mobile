import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarHeight } from '@/src/utils/safe-area';

type UseStickyClaOptions = {
  /**
   * Additional offset to add to the bottom position
   * Useful for adjusting spacing between CTA and tab bar
   * @default 0
   */
  extraOffset?: number;
};

/**
 * useStickyCta - Hook for calculating sticky CTA button positioning
 *
 * Returns the bottom position value that accounts for:
 * - Device safe area (e.g., iPhone home indicator)
 * - Tab bar height
 * - Optional extra offset
 *
 * Use this to ensure CTA buttons don't overlap with the tab bar
 * and respect device safe areas across all screen sizes.
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { bottom, tabBarHeight, paddingBottom } = useStickyCta();
 *
 *   return (
 *     <>
 *       <ScrollView
 *         contentContainerStyle={{ paddingBottom }}
 *       >
 *         {content}
 *       </ScrollView>
 *
 *       <View style={{ position: 'absolute', bottom }}>
 *         <Button>Book Ride</Button>
 *       </View>
 *     </>
 *   );
 * }
 * ```
 */
export function useStickyCta(options: UseStickyClaOptions = {}) {
  const { extraOffset = 0 } = options;
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);

  return useMemo(() => {
    // Calculate bottom position for absolutely positioned CTA
    const bottom = tabBarHeight + extraOffset;

    // Calculate padding bottom for ScrollView content
    // This should account for CTA height + tab bar + some spacing
    // Typical CTA height is ~70-90px (content + padding)
    const ctaHeight = 90; // Estimated CTA component height
    const paddingBottom = tabBarHeight + ctaHeight + 20;

    return {
      /**
       * Bottom position value for absolutely positioned CTA
       */
      bottom,
      /**
       * Tab bar height (includes safe area bottom inset)
       */
      tabBarHeight,
      /**
       * Safe area bottom inset
       */
      safeAreaBottom: insets.bottom,
      /**
       * Recommended padding bottom for ScrollView content
       * to ensure content is not hidden behind sticky CTA
       */
      paddingBottom,
    };
  }, [tabBarHeight, extraOffset, insets.bottom]);
}
