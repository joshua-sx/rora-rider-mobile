import type BottomSheet from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomePopularCarousel } from "@/components/home-popular-carousel";
import { PillSearchBar } from "@/components/ui/pill-search-bar";
import { Sheet } from "@/src/ui/components/Sheet";
import { space } from "@/src/ui/tokens/spacing";

type DestinationBottomSheetProps = {
  bottomInset?: number; // Tab bar height (optional override)
};

export function DestinationBottomSheet({
	bottomInset = 0,
}: DestinationBottomSheetProps) {
	const bottomSheetRef = useRef<BottomSheet>(null);
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width: screenWidth } = useWindowDimensions();
	const animatedIndex = useSharedValue(1);

	// Track bottom sheet position: true = expanded (show carousel), false = collapsed (hide carousel)
	const [isExpanded, setIsExpanded] = useState(true);
	const [carouselHeight, setCarouselHeight] = useState<number | null>(null);

	// Calculate total bottom padding: device safe area + tab bar height
	// This ensures content never renders under the floating tab bar
	const totalBottomPadding = insets.bottom + bottomInset;

	// Two snap points: collapsed (pill only) and expanded (pill + cards)
	const snapPoints = useMemo(() => {
		const handleIndicatorSpace = 12; // Handle indicator + top margin
		const topPadding = space[5]; // 20px
		const pillHeight = 60; // Updated to match new pill height

		// Collapsed state: just pill search bar
		// Snap point = handle + top padding + pill + bottom padding + safe area/tab bar
		const bottomContentPadding = space[5]; // 20px applied in contentContainerStyle
		const collapsedHeight =
			handleIndicatorSpace +
			topPadding +
			pillHeight +
			bottomContentPadding +
			totalBottomPadding;

		// Expanded state: pill + popular locations cards
		const gapAfterPill = space[5]; // 20px (matches marginTop on carousel)
		const cardWidth = screenWidth * 0.5; // Card width (50% screen width)
		const cardHeight = cardWidth; // Square aspect ratio (width = height)

		// Carousel structure (home-popular-carousel.tsx:84-119):
		// 1. Header row (flexDirection: row, alignItems: center):
		//    - Icon (20px) + gap (space[2] = 8px) + Text (h2 variant ~20-22px line height)
		//    - Total row height: ~32px (height of tallest element)
		// 2. Header bottom margin: space[4] = 16px
		// 3. Card (square, popular-location-card.tsx:54): height = width
		const headerRowHeight = 32; // Icon row with star + text
		const headerBottomMargin = space[4]; // 16px
		const estimatedCarouselHeight =
			headerRowHeight + headerBottomMargin + cardHeight;

		const effectiveCarouselHeight = carouselHeight ?? estimatedCarouselHeight;

		const expandedHeight =
			handleIndicatorSpace +
			topPadding +
			pillHeight +
			gapAfterPill +
			effectiveCarouselHeight +
			bottomContentPadding +
			totalBottomPadding;

		console.log("[DestinationBottomSheet] Snap points calculated:", {
			collapsed: collapsedHeight,
			expanded: expandedHeight,
			screenWidth,
			cardWidth,
			cardHeight,
			carouselHeight: effectiveCarouselHeight,
			isEstimate: carouselHeight === null,
			breakdown: {
				handleIndicatorSpace,
				topPadding,
				pillHeight,
				gapAfterPill,
				headerRowHeight,
				headerBottomMargin,
				effectiveCarouselHeight,
				bottomContentPadding,
				totalBottomPadding,
				bottomInset,
				safeAreaBottom: insets.bottom,
			},
		});

		return [collapsedHeight, expandedHeight];
	}, [carouselHeight, screenWidth, totalBottomPadding, bottomInset, insets.bottom]);

	// Callback when bottom sheet position changes
	const handleSheetChange = useCallback((index: number) => {
		// index 0 = collapsed (hide carousel), index 1 = expanded (show carousel)
		setIsExpanded(index === 1);
		// Note: animatedIndex SharedValue is automatically updated by the bottom sheet
		// when passed as a prop, so no manual synchronization needed here
	}, []);

	const handleSearchPress = useCallback(() => {
		router.push("/route-input");
	}, [router]);

	const carouselAnimatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			animatedIndex.value,
			[0, 0.2, 1],
			[0, 0, 1],
			"clamp",
		);
		const translateY = interpolate(
			animatedIndex.value,
			[0, 1],
			[12, 0],
			"clamp",
		);
		const scale = interpolate(
			animatedIndex.value,
			[0, 1],
			[0.98, 1],
			"clamp",
		);

		return {
			opacity,
			transform: [{ translateY }, { scale }],
		};
	}, []);

	const handleCarouselLayout = useCallback((event: LayoutChangeEvent) => {
		const nextHeight = event.nativeEvent.layout.height;
		setCarouselHeight((current) => {
			if (current === null) return nextHeight;
			if (Math.abs(current - nextHeight) < 1) return current;
			return nextHeight;
		});
	}, []);

	// Ensure animatedIndex is initialized correctly on mount
	useEffect(() => {
		// Initialize animatedIndex to match initial index (1 = expanded)
		animatedIndex.value = 1;
	}, [animatedIndex]);

	return (
		<Sheet
			ref={bottomSheetRef}
			index={1}
			snapPoints={snapPoints}
			animatedIndex={animatedIndex}
			backgroundStyle={styles.background}
			handleIndicatorStyle={styles.handleIndicator}
			enablePanDownToClose={false}
			onChange={handleSheetChange}
			animateOnMount={false}
			enableOverDrag={false}
			overDragResistanceFactor={0}
			enableDynamicSizing={false}
			// Gesture thresholds: allow horizontal scrolling with smaller vertical movement
			// activeOffsetY: vertical pan activates after 15px movement (prevents accidental drags)
			// failOffsetX: horizontal pan fails after 5px movement (allows horizontal scroll to take priority)
			activeOffsetY={[-15, 15]}
			failOffsetX={[-5, 5]}
			contentContainerStyle={{
				paddingTop: space[5], // 20px
				paddingBottom: space[5] + totalBottomPadding, // Content padding + safe area + tab bar
				paddingHorizontal: space[5], // 20px
			}}
		>
			{/* Pill search bar */}
			<PillSearchBar onSearchPress={handleSearchPress} />

			{/* Popular locations carousel - hidden when collapsed */}
			<Animated.View
				style={[{ marginTop: space[5] }, carouselAnimatedStyle]}
				onLayout={handleCarouselLayout}
				pointerEvents={isExpanded ? "box-none" : "none"}
			>
				<HomePopularCarousel />
			</Animated.View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	background: {
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
		// Custom handle styling if needed
	},
});
