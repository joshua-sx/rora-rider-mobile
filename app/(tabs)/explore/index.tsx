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
import { useCallback, useRef, useState } from "react";
import type { TextInput } from "react-native";
import { FlatList, Keyboard, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getHeaderTopPadding } from "@/utils/safe-area";

export default function ExploreScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const searchInputRef = useRef<TextInput>(null);

	const [inputValue, setInputValue] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
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

	const calculatedHeaderPaddingTop = getHeaderTopPadding(insets, 16);

	return (
		<ThemedView style={[styles.container, { backgroundColor }]}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: calculatedHeaderPaddingTop }]}>
				{!isSearchActive && (
					<ThemedText style={styles.title}>Explore</ThemedText>
				)}
				<SearchBar
					ref={searchInputRef}
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
								<ThemedText
									style={[styles.seeAll, { color: primaryColor }]}
									onPress={handleSeeAllPress}
								>
									See all →
								</ThemedText>
							</View>
							<View style={styles.sectionContent}>
								{featuredVenues.map((venue) => (
									<FeaturedVenueCard
										key={venue.id}
										venue={venue}
										onPress={handleVenuePress}
									/>
								))}
							</View>
						</View>

						{/* Near You Section */}
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<ThemedText style={styles.sectionTitle}>NEAR YOU</ThemedText>
							</View>
							<View style={styles.sectionContent}>
								{nearbyVenues.map((venue) => (
									<VenueListItem
										key={venue.id}
										venue={venue}
										onPress={handleVenuePress}
									/>
								))}
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
