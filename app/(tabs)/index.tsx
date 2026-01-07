import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RideSheet } from "@/src/features/ride/components/RideSheet";
import { useRideSheetStore } from "@/src/features/ride/store/ride-sheet-store";
import { LocationPermissionModal } from "@/src/features/home/components/location-permission-modal";
import { MapErrorBoundary } from "@/src/ui/components/MapErrorBoundary";
import { locationService } from "@/src/services/location.service";
import { locationStorageService } from "@/src/services/location-storage.service";
import { useLocationStore } from "@/src/store/location-store";
import { getTabBarHeight } from "@/src/utils/safe-area";
import { colors } from "@/src/ui/tokens/colors";

// Default location: St. Maarten (matching the reference images)
const INITIAL_REGION = {
	latitude: 18.0425,
	longitude: -63.0548,
	latitudeDelta: 0.0922,
	longitudeDelta: 0.0421,
};

export default function HomeScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const tabBarHeight = getTabBarHeight(insets);
	const mapRef = useRef<MapView>(null);

	// RideSheet state for map overlays
	const rideState = useRideSheetStore((s) => s.state);
	const rideData = useRideSheetStore((s) => s.data);

	const {
		setCurrentLocation,
		setFormattedAddress,
		setPermissionGranted,
		setPermissionStatus,
		setPermissionRequested,
		setIsLoadingLocation,
		setLocationSubscription,
		permissionRequested,
		showPermissionModal,
		setShowPermissionModal,
		hydrate,
		locationSubscription,
	} = useLocationStore();
	const [mapRegion, setMapRegion] = useState(INITIAL_REGION);

	const startLocationTracking = useCallback(async () => {
		try {
			setIsLoadingLocation(true);
			console.log("[HomeScreen] Starting location tracking...");

			if (locationSubscription) {
				console.log("[HomeScreen] Removing existing location subscription");
				locationSubscription.remove();
				setLocationSubscription(null);
			}

			const status = await locationService.getPermissionStatus();
			setPermissionStatus(status);
			if (status !== Location.PermissionStatus.GRANTED) {
				console.warn("[HomeScreen] Permission not granted, skipping tracking");
				return;
			}

			// Get initial position
			const position = await locationService.getCurrentPosition();

			if (position) {
				console.log("[HomeScreen] Got initial position:", position);
				setCurrentLocation(position);

				// Reverse geocode to get formatted address
				try {
					const formattedAddress = await locationService.reverseGeocode(
						position.latitude,
						position.longitude,
					);
					if (formattedAddress) {
						console.log("[HomeScreen] Formatted address:", formattedAddress);
						setFormattedAddress(formattedAddress);
					}
				} catch (geocodeError) {
					console.warn(
						"[HomeScreen] Reverse geocoding failed:",
						geocodeError,
					);
					// Continue without address
				}

				// Update map to center on user's location
				setMapRegion({
					latitude: position.latitude,
					longitude: position.longitude,
					latitudeDelta: 0.0922,
					longitudeDelta: 0.0421,
				});

				// Start continuous location tracking
				const subscription = await locationService.watchPosition((newPosition) => {
					console.log("[HomeScreen] Location update:", newPosition);
					setCurrentLocation(newPosition);

					// Optionally update map region as user moves
					setMapRegion({
						latitude: newPosition.latitude,
						longitude: newPosition.longitude,
						latitudeDelta: 0.0922,
						longitudeDelta: 0.0421,
					});
				});

				setLocationSubscription(subscription);
				console.log("[HomeScreen] Location tracking started");
			}
		} catch (error) {
			console.error("[HomeScreen] Location tracking error:", error);
		} finally {
			setIsLoadingLocation(false);
		}
	}, [
		locationSubscription,
		setIsLoadingLocation,
		setLocationSubscription,
		setPermissionStatus,
		setCurrentLocation,
		setFormattedAddress,
		setMapRegion,
	]);

	// Load persisted location data and initialize location tracking
	useEffect(() => {
		// Only check permissions once
		if (permissionRequested) return;

		async function initializeLocation() {
			try {
				// 1. Load persisted location data from AsyncStorage
				const loadResult = await locationStorageService.load();
				if (loadResult.success && loadResult.data) {
					console.log("[HomeScreen] Loaded persisted location data");
					hydrate(loadResult.data);

					// Update map with persisted location if available
					if (loadResult.data.currentLocation) {
						setMapRegion({
							latitude: loadResult.data.currentLocation.latitude,
							longitude: loadResult.data.currentLocation.longitude,
							latitudeDelta: 0.0922,
							longitudeDelta: 0.0421,
						});
					}
				} else if (!loadResult.success) {
					console.warn("[HomeScreen] Failed to load persisted location:", loadResult.error);
				}

				// 2. Check current permission status
				const status = await locationService.getPermissionStatus();
				console.log("[HomeScreen] Initial permission status:", status);
				setPermissionStatus(status);

				if (status === Location.PermissionStatus.GRANTED) {
					// Permission already granted - start location tracking
					console.log("[HomeScreen] Permission already granted");
					setPermissionRequested(true);
					await startLocationTracking();
				} else if (status === Location.PermissionStatus.UNDETERMINED) {
					// Show custom modal before system prompt
					console.log("[HomeScreen] Permission undetermined - showing modal");
					setShowPermissionModal(true);
					setPermissionRequested(true);
				} else {
					// Permission denied - allow manual entry
					console.log("[HomeScreen] Permission denied - manual entry mode");
					setPermissionRequested(true);
				}
			} catch (error) {
				console.error("[HomeScreen] Initialization error:", error);
				setPermissionRequested(true);
			}
		}

		initializeLocation();
	}, [
		startLocationTracking,
		permissionRequested,
		setPermissionStatus,
		setPermissionRequested,
		setShowPermissionModal,
		hydrate,
	]);

	// Cleanup location subscription on unmount
	useEffect(() => {
		return () => {
			if (locationSubscription) {
				console.log("[HomeScreen] Cleaning up location subscription");
				locationSubscription.remove();
				setLocationSubscription(null);
			}
		};
	}, [locationSubscription, setLocationSubscription]);

	// Fit map to route when route data changes
	useEffect(() => {
		if (rideData.routeData?.coordinates && rideData.routeData.coordinates.length > 0) {
			// Fit map to show entire route with padding for the sheet
			mapRef.current?.fitToCoordinates(rideData.routeData.coordinates, {
				edgePadding: {
					top: 100,
					right: 60,
					bottom: 350, // Account for bottom sheet
					left: 60,
				},
				animated: true,
			});
		}
	}, [rideData.routeData?.coordinates]);

	// Show route on map when we have origin/destination but no polyline yet
	const showOriginDestinationMarkers = useMemo(() => {
		return rideState !== 'IDLE' && rideData.origin && rideData.destination;
	}, [rideState, rideData.origin, rideData.destination]);

	// Show route polyline when route data is available
	const showRoutePolyline = useMemo(() => {
		return rideData.routeData?.coordinates && rideData.routeData.coordinates.length > 0;
	}, [rideData.routeData?.coordinates]);

	// Show driver markers during discovery/offers
	const showDriverMarkers = useMemo(() => {
		return (
			(rideState === 'DISCOVERING' || rideState === 'OFFERS_RECEIVED') &&
			rideData.offers.length > 0
		);
	}, [rideState, rideData.offers]);

	const handleAllowAccess = async () => {
		try {
			console.log("[HomeScreen] User tapped 'Allow Location Access'");
			setShowPermissionModal(false);
			setPermissionRequested(true);

			// Request system permission
			const status = await locationService.requestPermissions();
			setPermissionStatus(status);

			if (status === Location.PermissionStatus.GRANTED) {
				console.log("[HomeScreen] Permission granted by user");
				await startLocationTracking();
			} else {
				console.warn("[HomeScreen] Permission denied by user");
			}
		} catch (error) {
			console.error("[HomeScreen] Permission request error:", error);
		}
	};

	const handleEnterManually = () => {
		console.log("[HomeScreen] User chose manual entry");
		setShowPermissionModal(false);
		setPermissionGranted(false);

		// Navigate to route input for manual location entry
		router.push({
			pathname: "/route-input",
			params: { manualEntry: "true" },
		});
	};

	return (
		<GestureHandlerRootView style={styles.container}>
			<View style={styles.container}>
				<MapErrorBoundary>
					<MapView
						ref={mapRef}
						provider={PROVIDER_GOOGLE}
						style={styles.map}
						initialRegion={mapRegion}
						showsUserLocation
						showsMyLocationButton={false}
						showsCompass={false}
					>
						{/* Route polyline */}
						{showRoutePolyline && rideData.routeData?.coordinates && (
							<Polyline
								coordinates={rideData.routeData.coordinates}
								strokeWidth={4}
								strokeColor={colors.text}
							/>
						)}

						{/* Origin marker */}
						{showOriginDestinationMarkers && rideData.origin && (
							<Marker
								coordinate={rideData.origin.coordinates}
								anchor={{ x: 0.5, y: 0.5 }}
							>
								<View style={styles.originMarker}>
									<View style={styles.originDot} />
								</View>
							</Marker>
						)}

						{/* Destination marker */}
						{showOriginDestinationMarkers && rideData.destination && (
							<Marker
								coordinate={rideData.destination.coordinates}
								anchor={{ x: 0.5, y: 1 }}
								pinColor={colors.danger}
							/>
						)}

						{/* Driver markers during discovery */}
						{showDriverMarkers &&
							rideData.offers.map((offer, index) =>
								offer.driverLocation ? (
									<Marker
										key={offer.id}
										coordinate={offer.driverLocation}
										anchor={{ x: 0.5, y: 0.5 }}
										title={offer.driver_profile?.display_name}
									>
										<View style={styles.driverMarker}>
											<View style={styles.driverMarkerInner}>
												<View style={styles.driverMarkerText}>
													<View style={styles.driverNumberBadge}>
														<View style={styles.driverNumber} />
													</View>
												</View>
											</View>
										</View>
									</Marker>
								) : null
							)}
					</MapView>
				</MapErrorBoundary>

				{/* State-driven bottom sheet */}
				<RideSheet bottomInset={tabBarHeight} />

				{/* Custom Location Permission Modal */}
				<LocationPermissionModal
					visible={showPermissionModal}
					onAllowAccess={handleAllowAccess}
					onEnterManually={handleEnterManually}
				/>
			</View>
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
	// Origin marker (green dot)
	originMarker: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	originDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: colors.primary,
		borderWidth: 2,
		borderColor: colors.surface,
	},
	// Driver marker (car icon placeholder)
	driverMarker: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	driverMarkerInner: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	driverMarkerText: {
		alignItems: "center",
		justifyContent: "center",
	},
	driverNumberBadge: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	driverNumber: {
		width: 8,
		height: 8,
		backgroundColor: colors.surface,
		borderRadius: 4,
	},
});
