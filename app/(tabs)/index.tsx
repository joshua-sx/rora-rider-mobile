import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "react-native-maps";
import * as Location from "expo-location";

import { DestinationBottomSheet } from "@/components/destination-bottom-sheet";
import { LocationPermissionModal } from "@/components/location-permission-modal";
import { locationService } from "@/services/location.service";
import { locationStorageService } from "@/services/location-storage.service";
import { useLocationStore } from "@/store/location-store";

// Default location: St. Maarten (matching the reference images)
const INITIAL_REGION = {
	latitude: 18.0425,
	longitude: -63.0548,
	latitudeDelta: 0.0922,
	longitudeDelta: 0.0421,
};

// Tab bar height estimate for iOS native tabs
const TAB_BAR_HEIGHT = 85;

export default function HomeScreen() {
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

	const startLocationTracking = async () => {
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
	};

	// Load persisted location data and initialize location tracking
	useEffect(() => {
		// Only check permissions once
		if (permissionRequested) return;

		async function initializeLocation() {
			try {
				// 1. Load persisted location data from AsyncStorage
				const persisted = await locationStorageService.load();
				if (persisted) {
					console.log("[HomeScreen] Loaded persisted location data");
					hydrate(persisted);

					// Update map with persisted location if available
					if (persisted.currentLocation) {
						setMapRegion({
							latitude: persisted.currentLocation.latitude,
							longitude: persisted.currentLocation.longitude,
							latitudeDelta: 0.0922,
							longitudeDelta: 0.0421,
						});
					}
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
				<MapView
					style={styles.map}
					initialRegion={mapRegion}
					showsUserLocation
					showsMyLocationButton={false}
					showsCompass={false}
				/>
				<DestinationBottomSheet bottomInset={TAB_BAR_HEIGHT} />

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
});
