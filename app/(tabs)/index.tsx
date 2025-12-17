import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "react-native-maps";

import { DestinationBottomSheet } from "@/components/destination-bottom-sheet";
import { locationService } from "@/services/location.service";
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
		setPermissionGranted,
		setPermissionRequested,
		permissionRequested,
	} = useLocationStore();
	const [mapRegion, setMapRegion] = useState(INITIAL_REGION);

	useEffect(() => {
		// Only request permissions once
		if (permissionRequested) return;

		async function initializeLocation() {
			try {
				console.log("[HomeScreen] Requesting location permissions...");
				const granted = await locationService.requestPermissions();

				setPermissionGranted(granted);
				setPermissionRequested(true);

				if (!granted) {
					console.warn("[HomeScreen] Location permission denied by user");
					return;
				}

				console.log("[HomeScreen] Getting current position...");
				const position = await locationService.getCurrentPosition();

				if (position) {
					console.log("[HomeScreen] Got position:", position);
					setCurrentLocation(position);

					// Update map to center on user's location
					setMapRegion({
						latitude: position.latitude,
						longitude: position.longitude,
						latitudeDelta: 0.0922,
						longitudeDelta: 0.0421,
					});
				}
			} catch (error) {
				console.error("[HomeScreen] Location initialization error:", error);
			}
		}

		initializeLocation();
	}, [
		permissionRequested,
		setCurrentLocation,
		setPermissionGranted,
		setPermissionRequested,
	]);

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
