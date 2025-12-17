import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { SINT_MAARTEN_REGION } from "@/constants/config";
import { Colors, BorderRadius, Spacing } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRouteStore } from "@/store/route-store";
import { formatDistance, formatDuration, formatPrice } from "@/utils/pricing";

export default function TripPreviewScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const mapRef = useRef<MapView>(null);
	const bottomSheetRef = useRef<BottomSheet>(null);

	const { origin, destination, routeData } = useRouteStore();
	const [sheetIndex, setSheetIndex] = useState(0); // 0 = collapsed

	// Theme colors
	const backgroundColor = useThemeColor({ light: "#FFFFFF", dark: "#161616" }, "background");
	const surfaceColor = useThemeColor({ light: "#FFFFFF", dark: "#161616" }, "surface");
	const textColor = useThemeColor({ light: "#262626", dark: "#E5E7EA" }, "text");
	const secondaryTextColor = useThemeColor({ light: "#5C5F62", dark: "#8B8F95" }, "textSecondary");
	const borderColor = useThemeColor({ light: "#E3E6E3", dark: "#2F3237" }, "border");
	const handleIndicatorColor = useThemeColor({ light: "#E3E6E3", dark: "#2F3237" }, "border");
	const tintColor = useThemeColor({}, "tint");

	// Snap points for bottom sheet
	const snapPoints = useMemo(() => ["30%", "65%"], []);

	// Validate route data exists
	useEffect(() => {
		if (!routeData || !origin || !destination) {
			console.warn("No route data available, returning to input");
			// Guard/redirect: replace to avoid leaving an invalid screen in history.
			router.replace("/route-input");
		}
	}, [routeData, origin, destination, router]);

	// Fit map to show full route
	useEffect(() => {
		if (routeData?.coordinates && mapRef.current) {
			setTimeout(() => {
				mapRef.current?.fitToCoordinates(routeData.coordinates, {
					edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
					animated: true,
				});
			}, 500);
		}
	}, [routeData]);

	const handleBack = useCallback(() => {
		router.back();
	}, [router]);

	const handleEditRoute = useCallback(() => {
		router.back();
	}, [router]);

	const handleConfirmRide = useCallback(() => {
		// TODO: Navigate to ride confirmation or booking screen
		console.log("Confirm ride with route:", routeData);
	}, [routeData]);

	const handleSheetChange = useCallback((index: number) => {
		setSheetIndex(index);
	}, []);

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
				onChange={handleSheetChange}
				enablePanDownToClose={false}
				backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: surfaceColor }]}
				handleIndicatorStyle={[
					styles.handleIndicator,
					{ backgroundColor: handleIndicatorColor },
				]}
			>
				<BottomSheetView style={styles.bottomSheetContent}>
					{/* Collapsed State - Helper Text */}
					{sheetIndex === 0 && (
						<View style={styles.collapsedContent}>
							<Ionicons name="chevron-up" size={24} color={secondaryTextColor} />
							<ThemedText style={styles.helperText}>Slide up for trip details</ThemedText>
						</View>
					)}

					{/* Expanded State - Full Details */}
					{sheetIndex === 1 && (
						<View style={styles.expandedContent}>
							{/* Route Points */}
							<View style={styles.routeInfo}>
								<View style={styles.routePoint}>
									<View style={[styles.dot, { backgroundColor: tintColor }]} />
									<View style={styles.routePointText}>
										<ThemedText style={styles.routePointLabel}>Pickup</ThemedText>
										<ThemedText style={styles.routePointName} numberOfLines={1}>
											{origin.name}
										</ThemedText>
									</View>
								</View>

								<View style={[styles.routeLine, { backgroundColor: borderColor }]} />

								<View style={styles.routePoint}>
									<View style={[styles.dot, { backgroundColor: "#FF5733" }]} />
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
								<View>
									<ThemedText style={styles.priceLabel}>Estimated fare</ThemedText>
									<ThemedText style={styles.price}>
										{formatPrice(routeData.price)}
									</ThemedText>
								</View>
							</View>

							{/* QR Placeholder */}
							<View style={[styles.qrPlaceholder, { borderColor }]}>
								<Ionicons name="qr-code-outline" size={80} color={secondaryTextColor} />
								<ThemedText style={[styles.qrLabel, { color: secondaryTextColor }]}>
									Scan to confirm ride
								</ThemedText>
							</View>

							{/* Action Buttons */}
							<View style={styles.actions}>
								<Pressable
									onPress={handleEditRoute}
									style={[styles.secondaryButton, { borderColor }]}
									accessible
									accessibilityRole="button"
									accessibilityLabel="Edit route"
								>
									<ThemedText style={styles.secondaryButtonText}>Edit Route</ThemedText>
								</Pressable>

								<Pressable
									onPress={handleConfirmRide}
									style={[styles.primaryButton, { backgroundColor: tintColor }]}
									accessible
									accessibilityRole="button"
									accessibilityLabel="Confirm ride"
								>
									<ThemedText style={styles.primaryButtonText}>Confirm Ride</ThemedText>
								</Pressable>
							</View>
						</View>
					)}
				</BottomSheetView>
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
		paddingHorizontal: Spacing.xl,
	},
	collapsedContent: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing.xl,
	},
	helperText: {
		marginTop: Spacing.sm,
		fontSize: 16,
		fontWeight: "600",
	},
	expandedContent: {
		flex: 1,
		gap: Spacing.lg,
	},
	routeInfo: {
		paddingVertical: Spacing.md,
	},
	routePoint: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	dot: {
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
		height: 24,
		marginLeft: 5,
		marginVertical: 4,
	},
	tripDetails: {
		flexDirection: "row",
		gap: Spacing.xl,
		paddingVertical: Spacing.sm,
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
		paddingVertical: Spacing.lg,
		paddingHorizontal: Spacing.lg,
		borderWidth: 1,
		borderRadius: BorderRadius.card,
	},
	priceLabel: {
		fontSize: 13,
		fontWeight: "500",
		opacity: 0.6,
		marginBottom: 4,
	},
	price: {
		fontSize: 28,
		fontWeight: "700",
	},
	qrPlaceholder: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing.xxl,
		borderWidth: 2,
		borderRadius: BorderRadius.card,
		borderStyle: "dashed",
	},
	qrLabel: {
		marginTop: Spacing.md,
		fontSize: 14,
		fontWeight: "500",
	},
	actions: {
		flexDirection: "row",
		gap: Spacing.md,
		paddingBottom: Spacing.lg,
	},
	secondaryButton: {
		flex: 1,
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	primaryButton: {
		flex: 1,
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});
