import React, { type ReactNode } from 'react';
import { StyleSheet, View, ScrollView, FlatList, type FlatListProps, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { getTabBarHeight } from '@/src/utils/safe-area';

type BaseListScreenProps = {
  /**
   * Large title text displayed at top
   */
  title: string;
  /**
   * Optional subtitle below title
   */
  subtitle?: string;
  /**
   * Optional header content below title/subtitle
   */
  headerContent?: ReactNode;
  /**
   * Content to render
   */
  children: ReactNode;
  /**
   * Additional bottom padding beyond tab bar
   * @default 20
   */
  extraBottomPadding?: number;
};

type ScrollViewListProps = BaseListScreenProps & {
  /**
   * Use ScrollView for content
   */
  scrollable: true;
  /**
   * ScrollView props
   */
  scrollViewProps?: Omit<ScrollViewProps, 'children'>;
};

type FlatListProps_<T> = BaseListScreenProps & {
  /**
   * Use FlatList for content
   */
  scrollable: false;
  /**
   * FlatList component to render
   */
  flatList: ReactNode;
};

type ListScreenTemplateProps<T = any> = ScrollViewListProps | FlatListProps_<T>;

/**
 * ListScreenTemplate - Reusable template for list screens with iOS-style headers
 *
 * Features:
 * - iOS-style large title (32px, bold)
 * - Optional subtitle
 * - Optional header content (filters, search, etc.)
 * - ScrollView or FlatList support
 * - Automatic safe area handling
 * - Proper tab bar spacing
 *
 * @example
 * ```tsx
 * // ScrollView variant
 * <ListScreenTemplate
 *   title="Explore"
 *   subtitle="Discover places in Sint Maarten"
 *   scrollable={true}
 *   headerContent={<SearchBar />}
 * >
 *   <View>{/* Your content *\/}</View>
 * </ListScreenTemplate>
 *
 * // FlatList variant
 * <ListScreenTemplate
 *   title="Drivers"
 *   subtitle="Browse available drivers"
 *   scrollable={false}
 *   flatList={
 *     <FlatList
 *       data={drivers}
 *       renderItem={({ item }) => <DriverCard driver={item} />}
 *     />
 *   }
 * />
 * ```
 */
export function ListScreenTemplate<T = any>(props: ListScreenTemplateProps<T>) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(insets);

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );

  const { title, subtitle, headerContent, extraBottomPadding = 20 } = props;

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle && (
        <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
          {subtitle}
        </ThemedText>
      )}
      {headerContent}
    </View>
  );

  if (props.scrollable) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        {header}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + extraBottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...props.scrollViewProps}
        >
          {props.children}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {header}
      {props.flatList}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
});
