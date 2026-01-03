import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/src/ui/components/themed-text";
import { MapErrorBoundary } from "@/src/ui/components/MapErrorBoundary";
import { SINT_MAARTEN_REGION } from "@/src/constants/config";
import { Colors, BorderRadius, Spacing } from "@/src/constants/design-tokens";
import { getDriverById } from "@/src/features/drivers/data/drivers";
import { useThemeColor } from "@/src/hooks/use-theme-color";
import { useRouteStore } from "@/src/store/route-store";
import { useTripHistoryStore } from "@/src/store/trip-history-store";
import { formatDistance, formatDuration, formatPrice } from "@/src/utils/pricing";
import { fitMapToRoute } from "@/src/utils/map";
import { useToast } from "@/src/ui/providers/ToastProvider";
import { generateTripQR, generateManualCode } from "@/src/utils/trip-qr";

/**
 * Validates that coordinates array contains valid latitude/longitude objects
 */
function validateCoordinates(coords: { latitude: number; longitude: number }[]): boolean {
	if (!Array.isArray(coords) || coords.length === 0) return false;
	return coords.every(
		coord =>
			coord &&
			typeof coord.latitude === 'number' &&
			typeof coord.longitude === 'number' &&
			!Number.isNaN(coord.latitude) &&
			!Number.isNaN(coord.longitude)
	);
}

export default function TripPreviewScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height: screenHeight } = useWindowDimensions();
	const mapRef = useRef<MapView>(null);
	const bottomSheetRef = useRef<BottomSheet>(null);
	const { showToast } = useToast();

	const { origin, destination, routeData, selectedDriverId, clearDriver } = useRouteStore();
	const { addTrip, toggleSaved, getTripById } = useTripHistoryStore();

	// Get selected driver if any
	const selectedDriver = selectedDriverId ? getDriverById(selectedDriverId) : null;
	const [currentPage, setCurrentPage] = useState(0); // 0 = details, 1 = qr
	const [tripId, setTripId] = useState<string | null>(null);
	const [isSaved, setIsSaved] = useState(false);
	const [qrValue, setQrValue] = useState<string>('');
	const [manualCode, setManualCode] = useState<string>('');
	const [isFindingDrivers, setIsFindingDrivers] = useState(false);
	const [mapReady, setMapReady] = useState(false);

	// Gesture state for horizontal swipe
	const translateX = useRef(new Animated.Value(0)).current;

	// Theme colors
	const surfaceColor = useThemeColor({ light: "#FFFFFF", dark: "#161616" }, "surface");
	const textColor = useThemeColor({ light: "#262626", dark: "#E5E7EA" }, "text");
	const secondaryTextColor = useThemeColor({ light: "#5C5F62", dark: "#8B8F95" }, "textSecondary");
	const borderColor = useThemeColor({ light: "#E3E6E3", dark: "#2F3237" }, "border");
	const handleIndicatorColor = useThemeColor({ light: "#E3E6E3", dark: "#2F3237" }, "border");
	const tintColor = useThemeColor({}, "tint");

	// Tab bar height (approximate - native tabs are ~50px + safe area)
	const tabBarHeight = 50 + insets.bottom;

	// Bottom sheet snap points: expanded (70%) and collapsed (12%)
	const expandedHeight = useMemo(
		() => Math.round(screenHeight * 0.70),
		[screenHeight],
	);
	const collapsedHeight = useMemo(
		() => Math.round(screenHeight * 0.12),
		[screenHeight],
	);
	const snapPoints = useMemo(() => [expandedHeight, collapsedHeight], [expandedHeight, collapsedHeight]);

	const mapEdgePadding = useMemo(
		() => ({
			top: insets.top + 80,
			right: 60,
			bottom: expandedHeight + Spacing.xl,
			left: 60,
		}),
		[insets.top, expandedHeight],
	);

	const handleFitMapToRoute = useCallback(
		(coords: { latitude: number; longitude: number }[]) => {
			if (!mapRef.current) {
				console.warn('Map ref not ready');
				return;
			}
			fitMapToRoute(mapRef, coords, {
				edgePadding: mapEdgePadding,
			});
		},
		[mapEdgePadding],
	);

	// Validate route data exists and is valid
	useEffect(() => {
		if (!routeData || !origin || !destination) {
			console.warn("No route data available, returning to input");
			router.replace("/route-input");
			return;
		}

		if (!validateCoordinates(routeData.coordinates)) {
			console.error("Invalid route coordinates", routeData.coordinates);
			showToast("Route data is invalid. Please try again.");
			router.replace("/route-input");
			return;
		}

		if (typeof routeData.price !== 'number' || routeData.price <= 0) {
			console.error("Invalid route price", routeData.price);
			showToast("Unable to calculate price. Please try again.");
			router.replace("/route-input");
			return;
		}
	}, [routeData, origin, destination, router, showToast]);

	// Create safe quote object with fallback
	const quote = useMemo(() => {
		return routeData?.quote || {
			estimatedPrice: routeData?.price || 0,
			currency: 'USD' as const,
			pricingVersion: 'v1.0',
			createdAt: new Date().toISOString(),
		};
	}, [routeData]);

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
				quote,
				status: selectedDriverId ? 'pending' : 'not_taken',
				driverId: selectedDriverId || undefined,
			});
			setTripId(newTripId);
			console.log('[trip-preview] Trip saved to history:', newTripId);

			// Clear driver from route store after assignment
			if (selectedDriverId) {
				clearDriver();
			}
		}
	}, [routeData, origin, destination, tripId, addTrip, selectedDriverId, clearDriver, quote]);

	// Fit map to show full route when map is ready
	useEffect(() => {
		if (mapReady && routeData?.coordinates && validateCoordinates(routeData.coordinates)) {
			handleFitMapToRoute(routeData.coordinates);
		}
	}, [mapReady, routeData, handleFitMapToRoute]);

	// Generate QR code and manual code when trip is saved
	useEffect(() => {
		if (tripId) {
			const trip = getTripById(tripId);
			if (trip) {
				// Generate QR code
				generateTripQR(trip).then(setQrValue).catch((error) => {
					console.error('[trip-preview] Failed to generate QR:', error);
					setQrValue(tripId); // Fallback to simple tripId
				});

				// Generate manual code
				generateManualCode(tripId).then(setManualCode).catch((error) => {
					console.error('[trip-preview] Failed to generate manual code:', error);
				});
			}
		}
	}, [tripId, getTripById]);

	const handleClose = useCallback(() => {
		// Close and clear the quote session, navigate back to home
		router.push("/");
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

	const handleFindDrivers = useCallback(async () => {
		// Auto-save trip if not already saved
		if (tripId && !isSaved) {
			toggleSaved(tripId);
			setIsSaved(true);
		}

		// Show loading state
		setIsFindingDrivers(true);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		// Simulate finding drivers (2 seconds)
		await new Promise(resolve => setTimeout(resolve, 2000));

		// Show success
		setIsFindingDrivers(false);
		showToast("We'll notify drivers about this trip");
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		// Navigate home after brief delay
		setTimeout(() => {
			router.push("/");
		}, 1500);
	}, [tripId, toggleSaved, isSaved, showToast, router]);

	// Horizontal swipe gesture for page navigation
	const panGesture = Gesture.Pan()
		.onUpdate((event) => {
			translateX.setValue(event.translationX);
		})
		.onEnd((event) => {
			const SWIPE_THRESHOLD = 50;
			if (event.translationX > SWIPE_THRESHOLD && currentPage === 1) {
				// Swipe right → go to page 0
				Animated.timing(translateX, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}).start(() => {
					setCurrentPage(0);
					translateX.setValue(0);
				});
			} else if (event.translationX < -SWIPE_THRESHOLD && currentPage === 0) {
				// Swipe left → go to page 1
				Animated.timing(translateX, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}).start(() => {
					setCurrentPage(1);
					translateX.setValue(0);
				});
			} else {
				// Snap back
				Animated.spring(translateX, {
					toValue: 0,
					useNativeDriver: true,
				}).start();
			}
		});

	if (!routeData || !origin || !destination) {
		return null;
	}

	return (
		<GestureHandlerRootView style={styles.container}>
			{/* Fullscreen Map */}
			<MapErrorBoundary>
				<MapView
					ref={mapRef}
					style={styles.map}
					initialRegion={SINT_MAARTEN_REGION}
					showsUserLocation
					showsMyLocationButton={false}
					showsCompass={false}
					onMapReady={() => setMapReady(true)}
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
			</MapErrorBoundary>

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
					contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.md }}
					scrollEnabled={true}
				>
					{/* Header with X button */}
					<View style={styles.sheetHeader}>
						<View style={{ width: 40 }} />
						<ThemedText style={styles.sheetTitle}>Trip Quote</ThemedText>
						<Pressable
							onPress={handleClose}
							style={styles.closeButton}
							hitSlop={8}
							accessible
							accessibilityRole="button"
							accessibilityLabel="Close quote"
						>
							<Ionicons name="close" size={24} color={textColor} />
						</Pressable>
					</View>

					{/* Page Indicator - Tappable to switch pages */}
					<Pressable
						onPress={() => setCurrentPage(prev => prev === 0 ? 1 : 0)}
						style={styles.pageIndicator}
					>
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

					{/* Swipeable Content Container */}
					<GestureDetector gesture={panGesture}>
						<Animated.View style={{ transform: [{ translateX }] }}>
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

									{/* Assigned Driver Section */}
									{selectedDriver && (
										<View style={[styles.assignedDriverSection, { borderColor }]}>
											<ThemedText style={styles.sectionTitle}>Assigned Driver</ThemedText>
											<View style={styles.driverCard}>
												<View style={[styles.driverAvatar, { backgroundColor: borderColor }]}>
													<Ionicons name="person" size={24} color={secondaryTextColor} />
												</View>
												<View style={styles.driverDetails}>
													<ThemedText style={styles.driverName}>{selectedDriver.name}</ThemedText>
													<ThemedText style={[styles.driverMeta, { color: secondaryTextColor }]}>
														★ {selectedDriver.rating} • {selectedDriver.vehicleType}
													</ThemedText>
												</View>
												<Pressable
													onPress={() => router.push(`/driver/${selectedDriver.id}`)}
													style={[styles.viewProfileButton, { borderColor }]}
												>
													<ThemedText style={[styles.viewProfileText, { color: tintColor }]}>
														View
													</ThemedText>
												</Pressable>
											</View>
										</View>
									)}

									{/* Price Display */}
									<View style={[styles.priceContainer, { borderColor }]}>
										<ThemedText style={styles.priceLabel}>Estimated fare</ThemedText>
										<ThemedText style={styles.price}>
											{formatPrice(routeData.price)}
										</ThemedText>
									</View>

									{/* Action Buttons */}
									<View style={styles.actionButtons}>
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

										{/* Find Drivers Button */}
										<Pressable
											onPress={handleFindDrivers}
											style={[styles.findDriversButton, { borderColor, backgroundColor: surfaceColor }]}
											disabled={isFindingDrivers}
											accessible
											accessibilityRole="button"
											accessibilityLabel="Find available drivers"
										>
											{isFindingDrivers ? (
												<>
													<ActivityIndicator size="small" color={tintColor} />
													<ThemedText style={[styles.findDriversButtonText, { color: textColor }]}>
														Finding drivers...
													</ThemedText>
												</>
											) : (
												<>
													<Ionicons name="search-outline" size={20} color={tintColor} />
													<ThemedText style={[styles.findDriversButtonText, { color: tintColor }]}>
														Find drivers
													</ThemedText>
												</>
											)}
										</Pressable>
									</View>
								</View>
							)}

							{/* Page 2: QR Code */}
							{currentPage === 1 && (
								<View style={styles.page}>
									<ThemedText style={styles.pageTitle}>Your QR Code</ThemedText>

									{/* QR Code */}
									<View style={styles.qrContainer}>
										{qrValue ? (
											<QRCode
												value={qrValue}
												size={200}
												backgroundColor="white"
												color="black"
											/>
										) : (
											<ActivityIndicator size="large" color={tintColor} />
										)}
									</View>

									{/* Instruction Text */}
									<ThemedText style={styles.qrInstruction}>
										{selectedDriver ? `Show this code to ${selectedDriver.name}` : 'Show this code to your driver'}
									</ThemedText>
									<ThemedText style={[styles.qrSubtext, { color: secondaryTextColor }]}>
										Let driver scan for verification
									</ThemedText>

									{/* Manual Code Fallback */}
									{manualCode && (
										<View style={styles.manualCodeContainer}>
											<ThemedText style={[styles.manualCodeLabel, { color: secondaryTextColor }]}>
												Manual Code (if scanner fails)
											</ThemedText>
											<ThemedText style={styles.manualCodeText}>
												{manualCode}
											</ThemedText>
										</View>
									)}
								</View>
							)}
						</Animated.View>
					</GestureDetector>

					{/* Collapsed State Hint (visible when collapsed) */}
					<View style={styles.collapsedHint}>
						<ThemedText style={[styles.collapsedHintText, { color: secondaryTextColor }]}>
							Swipe up to see details
						</ThemedText>
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
	sheetHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.md,
	},
	sheetTitle: {
		fontSize: 18,
		fontWeight: "600",
	},
	closeButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	pageIndicator: {
		flexDirection: "row",
		gap: 8,
		justifyContent: "center",
		paddingVertical: Spacing.sm,
		marginBottom: Spacing.xs,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	page: {
		paddingHorizontal: Spacing.lg,
		minHeight: 400,
	},
	pageTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: Spacing.md,
	},
	routeInfo: {
		paddingVertical: Spacing.xs,
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
		height: 12,
		marginLeft: 5,
		marginVertical: 2,
	},
	tripDetails: {
		flexDirection: "row",
		gap: Spacing.xl,
		paddingVertical: Spacing.xs,
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
	assignedDriverSection: {
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.lg,
		borderWidth: 1,
		borderRadius: BorderRadius.card,
		marginBottom: Spacing.md,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "600",
		opacity: 0.6,
		marginBottom: Spacing.md,
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
	driverCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	driverAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	driverDetails: {
		flex: 1,
	},
	driverName: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 2,
	},
	driverMeta: {
		fontSize: 13,
	},
	viewProfileButton: {
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.sm,
		borderWidth: 1,
		borderRadius: BorderRadius.button,
	},
	viewProfileText: {
		fontSize: 14,
		fontWeight: "600",
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
	actionButtons: {
		gap: Spacing.md,
		marginBottom: Spacing.lg,
	},
	saveTripButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.md,
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
	},
	saveTripButtonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
	},
	findDriversButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.sm,
		paddingVertical: Spacing.md,
		borderRadius: BorderRadius.button,
		borderWidth: 1,
	},
	findDriversButtonText: {
		fontSize: 15,
		fontWeight: "600",
	},
	qrContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: Spacing.xxl,
		marginVertical: Spacing.lg,
	},
	qrInstruction: {
		fontSize: 24,
		fontWeight: "700",
		textAlign: "center",
		marginTop: Spacing.md,
	},
	qrSubtext: {
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
		marginTop: Spacing.sm,
		paddingHorizontal: Spacing.lg,
	},
	manualCodeContainer: {
		marginTop: Spacing.lg,
		paddingVertical: Spacing.lg,
		paddingHorizontal: Spacing.xl,
		alignItems: "center",
	},
	manualCodeLabel: {
		fontSize: 12,
		fontWeight: "500",
		marginBottom: Spacing.sm,
		textAlign: "center",
	},
	manualCodeText: {
		fontSize: 32,
		fontWeight: "700",
		letterSpacing: 4,
		textAlign: "center",
	},
	collapsedHint: {
		alignItems: "center",
		paddingVertical: Spacing.md,
	},
	collapsedHintText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
