import { CategoryChip } from "@/components/explore/category-chip";
import { FeaturedVenueCard } from "@/components/explore/featured-venue-card";
import { SearchBar } from "@/components/explore/search-bar";
import { SearchResults } from "@/components/explore/search-results";
import { VenueListItem } from "@/components/explore/venue-list-item";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CATEGORIES, getFeaturedVenues, getNearbyVenues } from "@/data/venues";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { CategoryInfo, Venue } from "@/types/venue";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Keyboard, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/src/ui/components/Skeleton";

export default function ExploreScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const [inputValue, setInputValue] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const debouncedQuery = useDebouncedValue(inputValue, 300);

	const backgroundColor = useThemeColor(
		{ light: "#F9F9F9", dark: "#0E0F0F" },
		"background",
	);
	const primaryColor = useThemeColor({}, "tint");

	const featuredVenues = getFeaturedVenues();
	const nearbyVenues = getNearbyVenues(5);

	const handleSearchFocus = useCallback(() => {
		setIsSearchActive(true);
	}, []);

	const handleSearchCancel = useCallback(() => {
		setIsSearchActive(false);
		setInputValue("");
		Keyboard.dismiss();
	}, []);

	const handleCategoryPress = useCallback(
		(category: CategoryInfo) => {
			router.push(`/explore/category/${category.slug}`);
		},
		[router],
	);

	const handleVenuePress = useCallback(
		(venue: Venue) => {
			setIsSearchActive(false);
			setInputValue("");
			Keyboard.dismiss();
			router.push(`/explore/venue/${venue.id}`);
		},
		[router],
	);

	const handleSeeAllPress = useCallback(() => {
		router.push("/explore/featured");
	}, [router]);

	// Simulate data loading (since we're using mock data)
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 600);
		return () => clearTimeout(timer);
	}, []);

	return (
		<ThemedView style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: 16 }]}>
				{!isSearchActive && (
					<ThemedText style={styles.title}>Explore</ThemedText>
				)}
				<SearchBar
					value={inputValue}
					onChangeText={setInputValue}
					onFocus={handleSearchFocus}
					onCancel={handleSearchCancel}
					isActive={isSearchActive}
					autoFocus={isSearchActive}
				/>
			</View>

			{/* Search Results */}
			{isSearchActive ? (
				<SearchResults
					query={debouncedQuery}
					onVenuePress={handleVenuePress}
					onCategoryPress={handleCategoryPress}
				/>
			) : (
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					scrollEventThrottle={16}
				>
					<View style={styles.scrollWrapper}>
						{/* Categories */}
						<View style={styles.categoriesSection}>
							<FlatList
								horizontal
								data={CATEGORIES}
								keyExtractor={(item) => item.slug}
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.categoriesContent}
								renderItem={({ item }) => (
									<CategoryChip category={item} onPress={handleCategoryPress} />
								)}
							/>
						</View>

						{/* Featured Section */}
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<ThemedText style={styles.sectionTitle}>FEATURED</ThemedText>
								{!isLoading && (
									<ThemedText
										style={[styles.seeAll, { color: primaryColor }]}
										onPress={handleSeeAllPress}
									>
										See all →
									</ThemedText>
								)}
							</View>
							<View style={styles.sectionContent}>
								{isLoading ? (
									<>
										<Skeleton width="100%" height={200} borderRadius={12} />
										<View style={{ height: 12 }} />
										<Skeleton width="100%" height={200} borderRadius={12} />
									</>
								) : (
									featuredVenues.map((venue) => (
										<FeaturedVenueCard
											key={venue.id}
											venue={venue}
											onPress={handleVenuePress}
										/>
									))
								)}
							</View>
						</View>

						{/* Near You Section */}
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<ThemedText style={styles.sectionTitle}>NEAR YOU</ThemedText>
							</View>
							<View style={styles.sectionContent}>
								{isLoading ? (
									<>
										{[1, 2, 3].map((i) => (
											<View key={i} style={{ marginBottom: 12, flexDirection: "row", gap: 12 }}>
												<Skeleton width={80} height={80} borderRadius={12} />
												<View style={{ flex: 1, gap: 8 }}>
													<Skeleton width="80%" height={20} borderRadius={4} />
													<Skeleton width="60%" height={16} borderRadius={4} />
													<Skeleton width="40%" height={16} borderRadius={4} />
												</View>
											</View>
										))}
									</>
								) : (
									nearbyVenues.map((venue) => (
										<VenueListItem
											key={venue.id}
											venue={venue}
											onPress={handleVenuePress}
										/>
									))
								)}
							</View>
						</View>

						{/* Bottom Padding */}
						<View style={{ height: 100 }} />
					</View>
				</ScrollView>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 20,
		paddingBottom: 16,
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		lineHeight: 42,
		marginBottom: 16,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	scrollWrapper: {
		flex: 1,
	},
	categoriesSection: {
		marginBottom: 32,
	},
	section: {
		marginBottom: 32,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "600",
		letterSpacing: 0.5,
		opacity: 0.6,
	},
	seeAll: {
		fontSize: 14,
		fontWeight: "500",
	},
	sectionContent: {
		paddingHorizontal: 20,
	},
	categoriesContent: {
		paddingHorizontal: 20,
		paddingRight: 20,
	},
});
