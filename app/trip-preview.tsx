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

import { Text, colors, space, radius } from "@/src/ui";
import { MapErrorBoundary } from "@/src/ui/components/MapErrorBoundary";
import { SINT_MAARTEN_REGION } from "@/src/constants/config";
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
			bottom: expandedHeight + space[5],
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
						pinColor={colors.primary}
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
						strokeColor={colors.primary}
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
					contentContainerStyle={{ paddingBottom: tabBarHeight + space[3] }}
					scrollEnabled={true}
				>
					{/* Header with X button */}
					<View style={styles.sheetHeader}>
						<View style={{ width: 40 }} />
						<Text style={styles.sheetTitle}>Trip Quote</Text>
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
									<Text style={styles.pageTitle}>Trip details</Text>

									{/* Route Points */}
									<View style={styles.routeInfo}>
										<View style={styles.routePoint}>
											<View style={[styles.routeDot, { backgroundColor: tintColor }]} />
											<View style={styles.routePointText}>
												<Text style={styles.routePointLabel}>Pickup</Text>
												<Text style={styles.routePointName} numberOfLines={1}>
													{origin.name}
												</Text>
											</View>
										</View>

										<View style={[styles.routeLine, { backgroundColor: borderColor }]} />

										<View style={styles.routePoint}>
											<View style={[styles.routeDot, { backgroundColor: "#FF5733" }]} />
											<View style={styles.routePointText}>
												<Text style={styles.routePointLabel}>Dropoff</Text>
												<Text style={styles.routePointName} numberOfLines={1}>
													{destination.name}
												</Text>
											</View>
										</View>
									</View>

									{/* Trip Details */}
									<View style={styles.tripDetails}>
										<View style={styles.detailItem}>
											<Ionicons name="time-outline" size={20} color={secondaryTextColor} />
											<Text style={styles.detailText}>
												{formatDuration(routeData.duration)}
											</Text>
										</View>
										<View style={styles.detailItem}>
											<Ionicons name="car-outline" size={20} color={secondaryTextColor} />
											<Text style={styles.detailText}>
												{formatDistance(routeData.distance)}
											</Text>
										</View>
									</View>

									{/* Assigned Driver Section */}
									{selectedDriver && (
										<View style={[styles.assignedDriverSection, { borderColor }]}>
											<Text style={styles.sectionTitle}>Assigned Driver</Text>
											<View style={styles.driverCard}>
												<View style={[styles.driverAvatar, { backgroundColor: borderColor }]}>
													<Ionicons name="person" size={24} color={secondaryTextColor} />
												</View>
												<View style={styles.driverDetails}>
													<Text style={styles.driverName}>{selectedDriver.name}</Text>
													<Text style={[styles.driverMeta, { color: secondaryTextColor }]}>
														★ {selectedDriver.rating} • {selectedDriver.vehicleType}
													</Text>
												</View>
												<Pressable
													onPress={() => router.push(`/driver/${selectedDriver.id}`)}
													style={[styles.viewProfileButton, { borderColor }]}
												>
													<Text style={[styles.viewProfileText, { color: tintColor }]}>
														View
													</Text>
												</Pressable>
											</View>
										</View>
									)}

									{/* Price Display */}
									<View style={[styles.priceContainer, { borderColor }]}>
										<Text style={styles.priceLabel}>Estimated fare</Text>
										<Text style={styles.price}>
											{formatPrice(routeData.price)}
										</Text>
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
											<Text style={styles.saveTripButtonText}>Save Trip</Text>
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
													<Text style={[styles.findDriversButtonText, { color: textColor }]}>
														Finding drivers...
													</Text>
												</>
											) : (
												<>
													<Ionicons name="search-outline" size={20} color={tintColor} />
													<Text style={[styles.findDriversButtonText, { color: tintColor }]}>
														Find drivers
													</Text>
												</>
											)}
										</Pressable>
									</View>
								</View>
							)}

							{/* Page 2: QR Code */}
							{currentPage === 1 && (
								<View style={styles.page}>
									<Text style={styles.pageTitle}>Your QR Code</Text>

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
									<Text style={styles.qrInstruction}>
										{selectedDriver ? `Show this code to ${selectedDriver.name}` : 'Show this code to your driver'}
									</Text>
									<Text style={[styles.qrSubtext, { color: secondaryTextColor }]}>
										Let driver scan for verification
									</Text>

									{/* Manual Code Fallback */}
									{manualCode && (
										<View style={styles.manualCodeContainer}>
											<Text style={[styles.manualCodeLabel, { color: secondaryTextColor }]}>
												Manual Code (if scanner fails)
											</Text>
											<Text style={styles.manualCodeText}>
												{manualCode}
											</Text>
										</View>
									)}
								</View>
							)}
						</Animated.View>
					</GestureDetector>

					{/* Collapsed State Hint (visible when collapsed) */}
					<View style={styles.collapsedHint}>
						<Text style={[styles.collapsedHintText, { color: secondaryTextColor }]}>
							Swipe up to see details
						</Text>
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
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
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
		paddingHorizontal: space[4],
		paddingVertical: space[3],
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
		paddingVertical: space[2],
		marginBottom: Spacing.xs,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	page: {
		paddingHorizontal: space[4],
		minHeight: 400,
	},
	pageTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: space[3],
	},
	routeInfo: {
		paddingVertical: Spacing.xs,
		marginBottom: space[2],
	},
	routePoint: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
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
		gap: space[5],
		paddingVertical: Spacing.xs,
		marginBottom: space[3],
	},
	detailItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
	},
	detailText: {
		fontSize: 15,
		fontWeight: "500",
	},
	assignedDriverSection: {
		paddingVertical: space[3],
		paddingHorizontal: space[4],
		borderWidth: 1,
		borderRadius: radius.lg,
		marginBottom: space[3],
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "600",
		opacity: 0.6,
		marginBottom: space[3],
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
	driverCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
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
		paddingHorizontal: space[3],
		paddingVertical: space[2],
		borderWidth: 1,
		borderRadius: radius.md,
	},
	viewProfileText: {
		fontSize: 14,
		fontWeight: "600",
	},
	priceContainer: {
		paddingVertical: space[3],
		paddingHorizontal: space[4],
		borderWidth: 1,
		borderRadius: radius.lg,
		marginBottom: space[3],
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
		gap: space[3],
		marginBottom: space[4],
	},
	saveTripButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: space[3],
		paddingVertical: space[4],
		borderRadius: radius.md,
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
		gap: space[2],
		paddingVertical: space[3],
		borderRadius: radius.md,
		borderWidth: 1,
	},
	findDriversButtonText: {
		fontSize: 15,
		fontWeight: "600",
	},
	qrContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: space[6],
		marginVertical: space[4],
	},
	qrInstruction: {
		fontSize: 24,
		fontWeight: "700",
		textAlign: "center",
		marginTop: space[3],
	},
	qrSubtext: {
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
		marginTop: space[2],
		paddingHorizontal: space[4],
	},
	manualCodeContainer: {
		marginTop: space[4],
		paddingVertical: space[4],
		paddingHorizontal: space[5],
		alignItems: "center",
	},
	manualCodeLabel: {
		fontSize: 12,
		fontWeight: "500",
		marginBottom: space[2],
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
		paddingVertical: space[3],
	},
	collapsedHintText: {
		fontSize: 14,
		fontWeight: "500",
	},
});
