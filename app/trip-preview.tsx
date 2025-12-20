import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { SINT_MAARTEN_REGION } from "@/constants/config";
import { Colors, BorderRadius, Spacing } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRouteStore } from "@/store/route-store";
import { useTripHistoryStore } from "@/store/trip-history-store";
import { formatDistance, formatDuration, formatPrice } from "@/utils/pricing";
import { fitMapToRoute } from "@/utils/map";
import { useToast } from "@/src/ui/providers/ToastProvider";

export default function TripPreviewScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height: screenHeight } = useWindowDimensions();
	const mapRef = useRef<MapView>(null);
	const bottomSheetRef = useRef<BottomSheet>(null);
	const { showToast } = useToast();

	const { origin, destination, routeData } = useRouteStore();
	const { addTrip, toggleSaved } = useTripHistoryStore();
	const [currentPage, setCurrentPage] = useState(0); // 0 = details, 1 = qr
	const [tripId, setTripId] = useState<string | null>(null);
	const [isSaved, setIsSaved] = useState(false);

	// Theme colors
	const surfaceColor = useThemeColor({ light: "#FFFFFF", dark: "#161616" }, "surface");
	const textColor = useThemeColor({ light: "#262626", dark: "#E5E7EA" }, "text");
	const secondaryTextColor = useThemeColor({ light: "#5C5F62", dark: "#8B8F95" }, "textSecondary");
	const borderColor = useThemeColor({ light: "#E3E6E3", dark: "#2F3237" }, "border");
	const handleIndicatorColor = useThemeColor({ light: "#E3E6E3", dark: "#2F3237" }, "border");
	const tintColor = useThemeColor({}, "tint");

	// Bottom sheet snap point: single expanded height
	// Increased to 65% to ensure Save Trip button is always visible
	const bottomSheetHeight = useMemo(
		() => Math.round(screenHeight * 0.65) + insets.bottom,
		[screenHeight, insets.bottom],
	);
	const snapPoints = useMemo(() => [bottomSheetHeight], [bottomSheetHeight]);

	const mapEdgePadding = useMemo(
		() => ({
			top: insets.top + 64,
			right: 50,
			bottom: bottomSheetHeight + Spacing.lg,
			left: 50,
		}),
		[insets.top, bottomSheetHeight],
	);

	const handleFitMapToRoute = useCallback(
		(coords: Array<{ latitude: number; longitude: number }>) => {
			fitMapToRoute(mapRef, coords, { edgePadding: mapEdgePadding });
		},
		[mapEdgePadding],
	);

	// Validate route data exists
	useEffect(() => {
		if (!routeData || !origin || !destination) {
			console.warn("No route data available, returning to input");
			router.replace("/route-input");
		}
	}, [routeData, origin, destination, router]);

	// Auto-save trip to history on mount
	useEffect(() => {
		if (routeData && origin && destination && !tripId) {
			const newTripId = `trip-${Date.now()}`;
			addTrip({
				id: newTripId,
				timestamp: Date.now(),
				origin,
				destination,
				routeData,
				status: 'not_taken',
			});
			setTripId(newTripId);
			console.log('[trip-preview] Trip saved to history:', newTripId);
		}
	}, [routeData, origin, destination, tripId, addTrip]);

	// Fit map to show full route
	useEffect(() => {
		if (routeData?.coordinates) {
			setTimeout(() => {
				handleFitMapToRoute(routeData.coordinates);
			}, 500);
		}
	}, [routeData, handleFitMapToRoute]);

	const handleBack = useCallback(() => {
		router.back();
	}, [router]);

	const handleSaveAndGoHome = useCallback(() => {
		if (tripId && !isSaved) {
			toggleSaved(tripId);
			setIsSaved(true);
		}

		// Show success feedback
		showToast("Trip saved successfully");
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		// Delay navigation to show toast
		setTimeout(() => {
			router.push("/");
		}, 800);
	}, [tripId, toggleSaved, isSaved, showToast, router]);

	const togglePage = useCallback(() => {
		setCurrentPage(prev => prev === 0 ? 1 : 0);
	}, []);

	// Pan responder for swipe gestures
	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_evt, gestureState) => {
				// Only respond to horizontal swipes (not vertical scrolling)
				return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
			},
			onPanResponderRelease: (_evt, gestureState) => {
				const SWIPE_THRESHOLD = 50;
				if (gestureState.dx > SWIPE_THRESHOLD && currentPage === 1) {
					// Swipe right → go to page 0
					setCurrentPage(0);
				} else if (gestureState.dx < -SWIPE_THRESHOLD && currentPage === 0) {
					// Swipe left → go to page 1
					setCurrentPage(1);
				}
			},
		})
	).current;

	if (!routeData || !origin || !destination) {
		return null;
	}

	return (
		<GestureHandlerRootView style={styles.container}>
			{/* Fullscreen Map */}
			<MapView
				ref={mapRef}
				style={styles.map}
				initialRegion={SINT_MAARTEN_REGION}
				showsUserLocation
				showsMyLocationButton={false}
				showsCompass={false}
			>
				{/* Origin Marker */}
				<Marker
					coordinate={origin.coordinates}
					title={origin.name}
					pinColor={Colors.primary}
				/>

				{/* Destination Marker */}
				<Marker
					coordinate={destination.coordinates}
					title={destination.name}
					pinColor="#FF5733"
				/>

				{/* Route Polyline */}
				<Polyline
					coordinates={routeData.coordinates}
					strokeWidth={4}
					strokeColor={Colors.primary}
				/>
			</MapView>

			{/* Header Overlay */}
			<View style={[styles.header, { paddingTop: insets.top + 12 }]}>
				<Pressable
					onPress={handleBack}
					style={[styles.backButton, { backgroundColor: surfaceColor }]}
					hitSlop={8}
					accessible
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
					<Ionicons name="arrow-back" size={24} color={textColor} />
				</Pressable>
			</View>

			{/* Bottom Sheet */}
			<BottomSheet
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				enablePanDownToClose={false}
				backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: surfaceColor }]}
				handleIndicatorStyle={[
					styles.handleIndicator,
					{ backgroundColor: handleIndicatorColor },
				]}
			>
				<BottomSheetScrollView
					style={styles.bottomSheetContent}
					contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.md }}
				>
					<View {...panResponder.panHandlers}>
						{/* Page Indicator - Swipeable */}
						<Pressable onPress={togglePage} style={styles.pageIndicator}>
							<View
								style={[
									styles.dot,
									currentPage === 0
										? { backgroundColor: tintColor }
										: { backgroundColor: "#D0D3D7" },
								]}
							/>
							<View
								style={[
									styles.dot,
									currentPage === 1
										? { backgroundColor: tintColor }
										: { backgroundColor: "#D0D3D7" },
								]}
							/>
						</Pressable>

						{/* Page 1: Trip Details */}
						{currentPage === 0 && (
							<View style={styles.page}>
								<ThemedText style={styles.pageTitle}>Trip details</ThemedText>

								{/* Route Points */}
								<View style={styles.routeInfo}>
									<View style={styles.routePoint}>
										<View style={[styles.routeDot, { backgroundColor: tintColor }]} />
										<View style={styles.routePointText}>
											<ThemedText style={styles.routePointLabel}>Pickup</ThemedText>
											<ThemedText style={styles.routePointName} numberOfLines={1}>
												{origin.name}
											</ThemedText>
										</View>
									</View>

									<View style={[styles.routeLine, { backgroundColor: borderColor }]} />

									<View style={styles.routePoint}>
										<View style={[styles.routeDot, { backgroundColor: "#FF5733" }]} />
										<View style={styles.routePointText}>
											<ThemedText style={styles.routePointLabel}>Dropoff</ThemedText>
											<ThemedText style={styles.routePointName} numberOfLines={1}>
												{destination.name}
											</ThemedText>
										</View>
									</View>
								</View>

								{/* Trip Details */}
								<View style={styles.tripDetails}>
									<View style={styles.detailItem}>
										<Ionicons name="time-outline" size={20} color={secondaryTextColor} />
										<ThemedText style={styles.detailText}>
											{formatDuration(routeData.duration)}
										</ThemedText>
									</View>
									<View style={styles.detailItem}>
										<Ionicons name="car-outline" size={20} color={secondaryTextColor} />
										<ThemedText style={styles.detailText}>
											{formatDistance(routeData.distance)}
										</ThemedText>
									</View>
								</View>

								{/* Price Display */}
								<View style={[styles.priceContainer, { borderColor }]}>
									<ThemedText style={styles.priceLabel}>Estimated fare</ThemedText>
									<ThemedText style={styles.price}>
										{formatPrice(routeData.price)}
									</ThemedText>
								</View>

								{/* Save Trip Button */}
								<Pressable
									onPress={handleSaveAndGoHome}
									style={[styles.saveTripButton, { backgroundColor: tintColor }]}
									accessible
									accessibilityRole="button"
									accessibilityLabel="Save trip and go home"
								>
									<Ionicons name="heart-outline" size={24} color="#FFFFFF" />
									<ThemedText style={styles.saveTripButtonText}>Save Trip</ThemedText>
								</Pressable>
							</View>
						)}

						{/* Page 2: QR Code */}
						{currentPage === 1 && (
							<View style={styles.page}>
								<ThemedText style={styles.pageTitle}>Your QR Code</ThemedText>

								{/* QR Code */}
								<View style={styles.qrContainer}>
									{tripId && (
										<QRCode
											value={tripId}
											size={200}
											backgroundColor="white"
											color="black"
										/>
									)}
								</View>

								{/* Instruction Text */}
								<ThemedText style={styles.qrInstruction}>
									Show the driver
								</ThemedText>
								<ThemedText style={[styles.qrSubtext, { color: secondaryTextColor }]}>
									Let driver scan for verification
								</ThemedText>
							</View>
						)}
					</View>
				</BottomSheetScrollView>
			</BottomSheet>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	map: {
		...StyleSheet.absoluteFillObject,
	},
	header: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		paddingHorizontal: Spacing.lg,
		zIndex: 10,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	bottomSheetBackground: {
		borderTopLeftRadius: BorderRadius.sheet,
		borderTopRightRadius: BorderRadius.sheet,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
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
	bottomSheetContent: {
		flex: 1,
	},
	pageIndicator: {
		flexDirection: "row",
		gap: 8,
		justifyContent: "center",
		paddingVertical: Spacing.sm,
		marginBottom: Spacing.sm,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	page: {
		paddingHorizontal: Spacing.xl,
	},
	pageTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: Spacing.md,
	},
	routeInfo: {
		paddingVertical: Spacing.sm,
		marginBottom: Spacing.sm,
	},
	routePoint: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	routeDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	routePointText: {
		flex: 1,
	},
	routePointLabel: {
		fontSize: 12,
		fontWeight: "500",
		opacity: 0.6,
		marginBottom: 2,
	},
	routePointName: {
		fontSize: 15,
		fontWeight: "500",
	},
	routeLine: {
		width: 2,
		height: 16,
		marginLeft: 5,
		marginVertical: 2,
	},
	tripDetails: {
		flexDirection: "row",
		gap: Spacing.xl,
		paddingVertical: Spacing.sm,
		marginBottom: Spacing.md,
	},
	detailItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
	},
	detailText: {
		fontSize: 15,
		fontWeight: "500",
	},
	priceContainer: {
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.lg,
		borderWidth: 1,
		borderRadius: BorderRadius.card,
		marginBottom: Spacing.md,
	},
	priceLabel: {
		fontSize: 13,
		fontWeight: "500",
		opacity: 0.6,
		marginBottom: 4,
	},
	price: {
		fontSize: 32,
		fontWeight: "700",
		lineHeight: 38,
	},
	saveTripButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.md,
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
		marginBottom: Spacing.sm,
	},
	saveTripButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
	},
	qrContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing.xxl,
		marginVertical: Spacing.xl,
	},
	qrInstruction: {
		fontSize: 24,
		fontWeight: "700",
		textAlign: "center",
		marginTop: Spacing.lg,
	},
	qrSubtext: {
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
		marginTop: Spacing.sm,
		paddingHorizontal: Spacing.lg,
	},
});
