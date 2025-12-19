import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

import { HomePopularCarousel } from "@/components/home-popular-carousel";
import { PillSearchBar } from "@/components/ui/pill-search-bar";
import { BorderRadius, Spacing } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";

type DestinationBottomSheetProps = {
  bottomInset?: number;
};

export function DestinationBottomSheet({
	bottomInset = 0,
}: DestinationBottomSheetProps) {
	const bottomSheetRef = useRef<BottomSheet>(null);
	const router = useRouter();

	const backgroundColor = useThemeColor(
		{ light: "#FFFFFF", dark: "#161616" },
		"surface",
	);
	const handleIndicatorColor = useThemeColor(
		{ light: "#E3E6E3", dark: "#2F3237" },
		"border",
	);

	const screenWidth = Dimensions.get("window").width;

	// Calculate snap point for square cards layout
	// Top padding: Spacing.xl (20px) - space above pill search
	// Pill bar: 56px
	// Gap after pill: Spacing.lg (16px)
	// Header "Popular locations": ~28px (h5 font + margins)
	// Square card height: screenWidth * 0.5 (matches width for square)
	// Bottom padding: Spacing.xl (20px) - same as top for symmetry
	// Tab bar inset: bottomInset (passed from parent)
	const snapPoints = useMemo(() => {
		const topPadding = Spacing.xl; // 20px - space above search bar
		const pillHeight = 56;
		const pillBottomGap = Spacing.lg; // 16px
		const headerHeight = 28; // Header with margins
		const cardHeight = screenWidth * 0.5; // Square card (50% screen width)
		const bottomPadding = Spacing.xl; // 20px - matching top padding for symmetry

		const totalHeight =
			topPadding +
			pillHeight +
			pillBottomGap +
			headerHeight +
			cardHeight +
			bottomPadding +
			bottomInset; // Tab bar height from parent

		return [totalHeight];
	}, [screenWidth, bottomInset]);

	const handleSearchPress = useCallback(() => {
		router.push("/route-input");
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
				contentContainerStyle={{
					paddingTop: Spacing.xl, // 20px
					paddingBottom: bottomInset + Spacing.xl, // Tab bar space + 20px padding
				}}
			>
				{/* Pill search bar */}
				<View style={{ paddingHorizontal: Spacing.xl }}>
					<PillSearchBar onSearchPress={handleSearchPress} />
				</View>

				{/* Popular locations carousel */}
				<View style={{ marginTop: Spacing.lg }}>
					<HomePopularCarousel />
				</View>
			</BottomSheetScrollView>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	background: {
		borderTopLeftRadius: BorderRadius.sheet, // 24px
		borderTopRightRadius: BorderRadius.sheet,
		shadowColor: "#000",
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
		marginTop: Spacing.sm, // 8px
	},
});
