import React, { type ReactNode } from 'react';
import { StyleSheet, ScrollView, type ScrollViewProps } from 'react-native';
import { ThemedView } from '../components/themed-view';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { useStickyCta } from '@/src/hooks/use-sticky-cta';

type DetailScreenTemplateProps = {
  /**
   * Hero header component (image, title, metadata)
   */
  header: ReactNode;
  /**
   * Main scrollable content
   */
  children: ReactNode;
  /**
   * Optional sticky CTA button at bottom
   */
  stickyButton?: ReactNode;
  /**
   * ScrollView props
   */
  scrollViewProps?: Omit<ScrollViewProps, 'children'>;
};

/**
 * DetailScreenTemplate - Reusable template for detail screens
 *
 * Features:
 * - Hero header section (typically image + title)
 * - Scrollable content area
 * - Optional sticky CTA button with proper spacing
 * - Automatic safe area handling
 * - Proper tab bar spacing
 *
 * Use with StickyCtaButton component for consistent CTA positioning.
 *
 * @example
 * ```tsx
 * <DetailScreenTemplate
 *   header={
 *     <VenueHeader
 *       venue={venue}
 *       onSavePress={handleSave}
 *       isSaved={isSaved}
 *     />
 *   }
 *   stickyButton={
 *     <StickyCtaButton
 *       label="Get a ride"
 *       onPress={handleBookRide}
 *       content={
 *         <Text>Est. trip: 12 min</Text>
 *       }
 *     />
 *   }
 * >
 *   <View>{/* Sections, maps, etc. *\/}</View>
 * </DetailScreenTemplate>
 * ```
 */
export function DetailScreenTemplate({
  header,
  children,
  stickyButton,
  scrollViewProps,
}: DetailScreenTemplateProps) {
  const { paddingBottom } = useStickyCta();

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          // Only add padding if there's a sticky button
          stickyButton && { paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {/* Hero Header */}
        {header}

        {/* Main Content */}
        {children}
      </ScrollView>

      {/* Sticky CTA Button */}
      {stickyButton}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
