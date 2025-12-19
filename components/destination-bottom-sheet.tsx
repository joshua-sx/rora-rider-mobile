import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomePopularCarousel } from "@/components/home-popular-carousel";
import { PillSearchBar } from "@/components/ui/pill-search-bar";
import { BorderRadius, Spacing } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";

type DestinationBottomSheetProps = {
  bottomInset?: number; // Tab bar height (optional override)
};

export function DestinationBottomSheet({
	bottomInset = 0,
}: DestinationBottomSheetProps) {
	const bottomSheetRef = useRef<BottomSheet>(null);
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const backgroundColor = useThemeColor(
		{ light: "#FFFFFF", dark: "#161616" },
		"surface",
	);
	const handleIndicatorColor = useThemeColor(
		{ light: "#E3E6E3", dark: "#2F3237" },
		"border",
	);

	const screenWidth = Dimensions.get("window").width;

	// Calculate total bottom padding: device safe area + tab bar height + content padding
	// This ensures content never scrolls under the floating tab bar
	const totalBottomPadding = insets.bottom + bottomInset + Spacing.xl;

	// Two snap points: collapsed (pill only) and expanded (pill + cards)
	const snapPoints = useMemo(() => {
		const handleIndicatorSpace = 12; // Handle indicator + top margin
		const topPadding = Spacing.xl; // 20px
		const pillHeight = 60; // Updated to match new pill height

		// Collapsed state: just pill search bar
		// Use totalBottomPadding to account for safe area + tab bar + content padding
		const collapsedHeight =
			handleIndicatorSpace + topPadding + pillHeight + totalBottomPadding;

		// Expanded state: pill + popular locations cards
		const gapAfterPill = Spacing.lg; // 16px
		const headerHeight = 28; // "Popular locations" header
		const cardHeight = screenWidth * 0.5; // Square card (50% screen width)

		const expandedHeight =
			handleIndicatorSpace +
			topPadding +
			pillHeight +
			gapAfterPill +
			headerHeight +
			cardHeight +
			totalBottomPadding;

		return [collapsedHeight, expandedHeight];
	}, [screenWidth, totalBottomPadding]);

	const handleSearchPress = useCallback(() => {
		router.push("/route-input");
	}, [router]);

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={1}
			snapPoints={snapPoints}
			backgroundStyle={[styles.background, { backgroundColor }]}
			handleIndicatorStyle={[
				styles.handleIndicator,
				{ backgroundColor: handleIndicatorColor },
			]}
			enablePanDownToClose={false}
		>
			<BottomSheetView
				style={{
					paddingTop: Spacing.xl, // 20px
					paddingBottom: totalBottomPadding, // Device safe area + tab bar + content padding
					paddingHorizontal: Spacing.xl, // 20px
				}}
			>
				{/* Pill search bar */}
				<PillSearchBar onSearchPress={handleSearchPress} />

				{/* Popular locations carousel */}
				<View style={{ marginTop: Spacing.lg }}>
					<HomePopularCarousel />
				</View>
			</BottomSheetView>
		</BottomSheet>
	);
}

const styles = StyleSheet.create({
	background: {
		borderTopLeftRadius: BorderRadius.sheet, // 24px
		borderTopRightRadius: BorderRadius.sheet,
		// No shadows - flat, clean appearance
		shadowColor: "transparent",
		shadowOffset: {
			width: 0,
			height: 0,
		},
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
	handleIndicator: {
		width: 40,
		height: 4,
		borderRadius: 2,
		marginTop: Spacing.sm, // 8px
	},
});
