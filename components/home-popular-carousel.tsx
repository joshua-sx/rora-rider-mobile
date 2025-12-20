import { useRef } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";

import { Text, colors, space } from "@/src/ui";
import { PopularLocationCard } from "@/components/ui/popular-location-card";
import { getVenueById } from "@/data/venues";
import { useLocationStore } from "@/store/location-store";
import { useRouteStore } from "@/store/route-store";

// Selected popular venues for home screen carousel
const POPULAR_VENUE_IDS = [
	"lotus-nightclub",
	"loterie-farm",
	"sonesta-resort",
	"maho-beach",
	"grand-case",
];

export function HomePopularCarousel() {
	const flatListRef = useRef<BottomSheetFlatList<any>>(null);
	const router = useRouter();
	const { setOrigin, setDestination } = useRouteStore();
	const { currentLocation, formattedAddress } = useLocationStore();

	const { width: screenWidth } = useWindowDimensions();
	const CARD_WIDTH = screenWidth * 0.5; // 50% screen width
	const CARD_GAP = space[4]; // 16px gap between cards

	// Get venue data for popular locations
	const venues = POPULAR_VENUE_IDS.map((id) => getVenueById(id)).filter(
		Boolean,
	);

	// Calculate distance using Haversine formula
	const calculateDistance = (
		venueLat: number,
		venueLng: number,
	): number | undefined => {
		if (!currentLocation) return undefined;

		const R = 6371; // Earth's radius in km
		const dLat = ((venueLat - currentLocation.latitude) * Math.PI) / 180;
		const dLon = ((venueLng - currentLocation.longitude) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((currentLocation.latitude * Math.PI) / 180) *
				Math.cos((venueLat * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c; // Distance in km
	};

	const handleVenuePress = (venue: any) => {
		// Auto-fill origin with current location
		if (currentLocation) {
			setOrigin({
				placeId: "current-location",
				name: "Current location",
				description: formattedAddress || "Current location",
				coordinates: currentLocation,
			});
		}

		// Auto-fill destination with selected venue
		setDestination({
			placeId: venue.id,
			name: venue.name,
			description: venue.shortDescription || venue.description || venue.name,
			coordinates: {
				latitude: venue.latitude,
				longitude: venue.longitude,
			},
		});

		// Navigate to route-input screen
		router.push("/route-input");
	};

	return (
		<View style={styles.container}>
			{/* Header with star icon */}
			<View style={styles.headerRow}>
				<Ionicons name="star" size={20} color={colors.primary} />
				<Text variant="h2">Popular locations</Text>
			</View>

			{/* Horizontal scrollable cards */}
			<BottomSheetFlatList
				ref={flatListRef}
				data={venues}
				horizontal
				snapToInterval={CARD_WIDTH + CARD_GAP}
				decelerationRate="fast"
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: space[5], // 20px on sides
					gap: CARD_GAP, // 16px gap between cards
				}}
				renderItem={({ item }) => (
					<PopularLocationCard
						location={{
							id: item.id,
							name: item.name,
							image: item.images?.[0] || "",
							description: item.shortDescription,
							distance: calculateDistance(item.latitude, item.longitude),
							estimatedDuration: item.estimatedDuration,
						}}
						width={CARD_WIDTH}
						onPress={() => handleVenuePress(item)}
					/>
				)}
				keyExtractor={(item) => item.id}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		// No top margin - parent controls spacing
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: space[5], // 20px to align with cards
		marginBottom: space[4], // 16px gap before cards
		gap: space[2], // 8px between star and text
	},
});
