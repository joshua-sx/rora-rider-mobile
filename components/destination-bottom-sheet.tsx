import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';

import { SearchInput } from '@/components/ui/search-input';
import { useThemeColor } from '@/hooks/use-theme-color';

type DestinationBottomSheetProps = {
  bottomInset?: number;
};

export function DestinationBottomSheet({
  bottomInset = 0,
}: DestinationBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const router = useRouter();

  const backgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#161616' },
    'surface'
  );
  const handleIndicatorColor = useThemeColor(
    { light: '#E3E6E3', dark: '#2F3237' },
    'border'
  );

  // Single snap point: collapsed state only
  const snapPoints = useMemo(
    () => [140 + bottomInset],
    [bottomInset]
  );

  const handleSearchPress = useCallback(() => {
    // Navigate to location picker with Google Places integration
    router.push('/location-picker');
  }, [router]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={[styles.background, { backgroundColor }]}
      handleIndicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: handleIndicatorColor },
      ]}
      enablePanDownToClose={false}
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomInset + 20 },
        ]}
      >
        <View style={styles.collapsedContent}>
          <SearchInput
            placeholder="Search destination"
            onPress={handleSearchPress}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  collapsedContent: {
    width: '100%',
  },
});
