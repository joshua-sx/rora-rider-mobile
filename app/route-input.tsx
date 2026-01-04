import { SINT_MAARTEN_REGION } from "@/src/constants/config";
import { Typography } from "@/src/constants/design-tokens";
import { getDriverById } from "@/src/features/drivers/data/drivers";
import { useThemeColor } from "@/src/hooks/use-theme-color";
import {
    googleMapsService,
    type PlaceResult,
} from "@/src/services/google-maps.service";
import { useLocationStore } from "@/src/store/location-store";
import { useRouteStore } from "@/src/store/route-store";
import { Text, colors, space, radius } from "@/src/ui";
import { useToast } from "@/src/ui/providers/ToastProvider";
import { calculatePrice } from "@/src/utils/pricing";
import { extractRouteData } from "@/src/utils/route-validation";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewState = "input" | "loading";

/**
 * Highlights matching text in autocomplete results
 * @param text - The full text to render
 * @param query - The search query to highlight
 * @returns React element with highlighted portions
 */
function HighlightedText({
	text,
	query,
	style,
	highlightColor = colors.primary,
}: {
	text: string;
	query: string;
	style?: any;
	highlightColor?: string;
}) {
	if (!query || !text) {
		return <Text style={style}>{text}</Text>;
	}

	// Find the matching substring (case-insensitive)
	const normalizedText = text.toLowerCase();
	const normalizedQuery = query.toLowerCase();
	const matchIndex = normalizedText.indexOf(normalizedQuery);

	if (matchIndex === -1) {
		return <Text style={style}>{text}</Text>;
	}

	// Split into three parts: before match, match, after match
	const beforeMatch = text.slice(0, matchIndex);
	const match = text.slice(matchIndex, matchIndex + query.length);
	const afterMatch = text.slice(matchIndex + query.length);

	return (
		<Text style={style}>
			{beforeMatch}
			<Text style={{ color: highlightColor, fontWeight: "600" }}>{match}</Text>
			{afterMatch}
		</Text>
	);
}

export default function RouteInputScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height: screenHeight } = useWindowDimensions();
	const bottomSheetRef = useRef<BottomSheet>(null);
	const mapRef = useRef<MapView>(null);
	const originAutocompleteRef = useRef<TextInput>(null);
	const destinationAutocompleteRef = useRef<TextInput>(null);
	const { manualEntry } = useLocalSearchParams<{ manualEntry?: string }>();
	const { showToast } = useToast();

	const {
		origin,
		destination,
		routeData,
		setOrigin,
		setDestination,
		setRouteData,
		setError,
		swapLocations,
		selectedDriverId,
		clearDriver,
	} = useRouteStore();

	const { setCurrentLocation, setFormattedAddress } = useLocationStore();

	// Driver context
	const selectedDriver = selectedDriverId ? getDriverById(selectedDriverId) : null;

	const [viewState, setViewState] = useState<ViewState>("input");
	const [isOriginFocused, setIsOriginFocused] = useState(false);
	const [isDestinationFocused, setIsDestinationFocused] = useState(false);

	// Custom autocomplete state
	const [originInput, setOriginInput] = useState(origin?.name || "");
	const [destinationInput, setDestinationInput] = useState(
		destination?.name || "",
	);
	const [originSuggestions, setOriginSuggestions] = useState<PlaceResult[]>([]);
	const [destinationSuggestions, setDestinationSuggestions] = useState<
		PlaceResult[]
	>([]);
	const [isOriginLoading, setIsOriginLoading] = useState(false);
	const [isDestinationLoading, setIsDestinationLoading] = useState(false);
	const [originSearchError, setOriginSearchError] = useState(false);
	const [destinationSearchError, setDestinationSearchError] = useState(false);
	const [showOriginEmpty, setShowOriginEmpty] = useState(false);
	const [showDestinationEmpty, setShowDestinationEmpty] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const backgroundColor = useThemeColor(
		{ light: "#FFFFFF", dark: "#161616" },
		"background",
	);
	const surfaceColor = useThemeColor(
		{ light: "#FFFFFF", dark: "#161616" },
		"surface",
	);
	const textColor = useThemeColor(
		{ light: "#262626", dark: "#E5E7EA" },
		"text",
	);
	const secondaryTextColor = useThemeColor(
		{ light: "#5C5F62", dark: "#8B8F95" },
		"textSecondary",
	);
	const iconColor = useThemeColor(
		{ light: "#5C5F62", dark: "#8B8F95" },
		"textSecondary",
	);
	const tintColor = useThemeColor({}, "tint");
	const borderColor = useThemeColor(
		{ light: "#E3E6E3", dark: "#2F3237" },
		"border",
	);
	const handleIndicatorColor = useThemeColor(
		{ light: "#E3E6E3", dark: "#2F3237" },
		"border",
	);

	const bottomSheetHeight = useMemo(
		() => Math.round(screenHeight * 0.45) + insets.bottom,
		[screenHeight, insets.bottom],
	);
	const snapPoints = useMemo(() => [bottomSheetHeight], [bottomSheetHeight]);
	const handleClose = useCallback(() => {
		router.back();
	}, [router]);

	// Clear driver selection when component unmounts or user goes back without route
	useEffect(() => {
		return () => {
			if (!routeData) {
				clearDriver();
			}
		};
	}, [routeData, clearDriver]);

	const handleSwap = useCallback(() => {
		swapLocations();
		// Swap the input text as well
		const tempOrigin = originInput;
		setOriginInput(destinationInput);
		setDestinationInput(tempOrigin);
		// Clear suggestions
		setOriginSuggestions([]);
		setDestinationSuggestions([]);
	}, [originInput, destinationInput, swapLocations]);

	// Debounced autocomplete search
	const searchPlaces = useCallback(async (query: string, isOrigin: boolean) => {
		if (!query || query.length < 2) {
			if (isOrigin) {
				setOriginSuggestions([]);
				setShowOriginEmpty(false);
				setOriginSearchError(false);
			} else {
				setDestinationSuggestions([]);
				setShowDestinationEmpty(false);
				setDestinationSearchError(false);
			}
			return;
		}

		if (isOrigin) {
			setIsOriginLoading(true);
			setOriginSearchError(false);
			setShowOriginEmpty(false);
		} else {
			setIsDestinationLoading(true);
			setDestinationSearchError(false);
			setShowDestinationEmpty(false);
		}

		try {
			const results = await googleMapsService.searchPlaces(query);

			if (isOrigin) {
				setOriginSuggestions(results);
				setShowOriginEmpty(results.length === 0);
			} else {
				setDestinationSuggestions(results);
				setShowDestinationEmpty(results.length === 0);
			}
		} catch (error) {
			console.error("[route-input] Autocomplete error:", error);
			if (isOrigin) {
				setOriginSuggestions([]);
				setOriginSearchError(true);
				setShowOriginEmpty(false);
			} else {
				setDestinationSuggestions([]);
				setDestinationSearchError(true);
				setShowDestinationEmpty(false);
			}
		} finally {
			if (isOrigin) setIsOriginLoading(false);
			else setIsDestinationLoading(false);
		}
	}, []);

	// Handle text input change with debounce (350ms per UX requirements)
	const handleOriginChange = useCallback(
		(text: string) => {
			setOriginInput(text);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => searchPlaces(text, true), 350);
		},
		[searchPlaces],
	);

	const handleDestinationChange = useCallback(
		(text: string) => {
			setDestinationInput(text);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => searchPlaces(text, false), 350);
		},
		[searchPlaces],
	);

	// Apply selected place
	const applyPlace = useCallback(
		async (place: PlaceResult, isOrigin: boolean) => {
			Keyboard.dismiss();
			if (isOrigin) setOriginSuggestions([]);
			else setDestinationSuggestions([]);

			try {
				const details = await googleMapsService.getPlaceDetails(place.placeId);
				const result = details?.result;
				const lat = result?.geometry?.location?.lat;
				const lng = result?.geometry?.location?.lng;

				if (typeof lat !== "number" || typeof lng !== "number") {
					throw new Error("Missing geometry in place details");
				}

				const placeDetails = {
					placeId: place.placeId,
					name: result?.name || place.mainText,
					description: result?.formatted_address || place.description,
					coordinates: { latitude: lat, longitude: lng },
				};

				if (isOrigin) {
					setOrigin(placeDetails);
					setOriginInput(placeDetails.name);
				} else {
					setDestination(placeDetails);
					setDestinationInput(placeDetails.name);
				}
			} catch (error) {
				console.error("[route-input] Place details error:", error);
			}
		},
		[setOrigin, setDestination],
	);

	// Fetch route via proxied Directions API
	const handleContinue = useCallback(async () => {
		if (!origin || !destination) return;

		Keyboard.dismiss();
		setViewState("loading");
		setError(null);
		setRouteData(null);

		try {
			const directions = await googleMapsService.getDirections(
				origin.coordinates,
				destination.coordinates,
			);

			const { distanceKm, durationMin, coordinates } =
				extractRouteData(directions);

			const { price, version } = calculatePrice(distanceKm, durationMin);

			setRouteData({
				distance: distanceKm,
				duration: durationMin,
				price,
				coordinates: coordinates,
				quote: {
					estimatedPrice: price,
					currency: 'USD' as const,
					pricingVersion: version,
					createdAt: new Date().toISOString(),
				},
			});

			// Navigate directly to trip-preview after route is calculated
			router.push("/trip-preview");
		} catch (e: unknown) {
			const message =
				e instanceof Error ? e.message : "Failed to fetch directions";
			console.error("[route-input] Directions error:", e);
			setError(message);
			const isNoRoute = message === "No route found";
			Alert.alert(
				isNoRoute ? "No route found" : "Service error",
				isNoRoute
					? "Try a different pickup or destination."
					: "We couldn't calculate this route. Please try again.",
			);
			setViewState("input");
		}
	}, [origin, destination, setError, setRouteData, router]);

	// Handle manual entry mode - when origin is selected, save to location store and go back
	useEffect(() => {
		if (manualEntry === "true" && origin) {
			setCurrentLocation(origin.coordinates);
			setFormattedAddress(origin.description);
			showToast("Location set successfully");
			setTimeout(() => {
				router.back();
			}, 800);
		}
	}, [
		manualEntry,
		origin,
		setCurrentLocation,
		setFormattedAddress,
		showToast,
		router,
	]);

	// Render autocomplete suggestion item with highlighted text
	const renderSuggestionItem = useCallback(
		({ item }: { item: PlaceResult }) => {
			const isOrigin = originSuggestions.includes(item);
			const currentQuery = isOrigin ? originInput : destinationInput;

			return (
				<Pressable
					style={[styles.suggestionItem, { backgroundColor: surfaceColor }]}
					onPress={() => applyPlace(item, isOrigin)}
				>
					<Ionicons
						name="location-outline"
						size={20}
						color={iconColor}
						style={styles.suggestionIcon}
					/>
					<View style={styles.suggestionContent}>
						<HighlightedText
							text={item.mainText}
							query={currentQuery}
							style={styles.suggestionMainText}
							highlightColor={tintColor}
						/>
						<HighlightedText
							text={item.secondaryText}
							query={currentQuery}
							style={[
								styles.suggestionSecondaryText,
								{ color: secondaryTextColor },
							]}
							highlightColor={tintColor}
						/>
					</View>
				</Pressable>
			);
		},
		[
			surfaceColor,
			secondaryTextColor,
			iconColor,
			tintColor,
			applyPlace,
			originSuggestions,
			originInput,
			destinationInput,
		],
	);

	// Input State UI
	if (viewState === "input") {
		return (
			<KeyboardAvoidingView
				style={[styles.container, { backgroundColor }]}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={0}
			>
				{/* Header - Fixed at top */}
				<View style={[styles.header, { paddingTop: insets.top + 12 }]}>
					<Pressable onPress={handleClose} hitSlop={8}>
						<Ionicons name="close" size={28} color={textColor} />
					</Pressable>
					<Text style={styles.headerTitle}>
						{manualEntry === "true" ? "Set your location" : "Your route"}
					</Text>
					<View style={{ width: 28 }} />
				</View>

				{/* Driver Banner */}
				{selectedDriver && (
					<View
						style={[
							styles.driverBanner,
							{ backgroundColor: `${tintColor}15`, borderBottomColor: borderColor },
						]}
					>
						<Ionicons name="person-circle-outline" size={24} color={tintColor} />
						<View style={styles.driverInfo}>
							<Text style={styles.driverName}>
								Booking with {selectedDriver.name}
							</Text>
							<Text style={[styles.driverMeta, { color: secondaryTextColor }]}>
								★ {selectedDriver.rating} • {selectedDriver.vehicleType}
							</Text>
						</View>
						<Pressable onPress={clearDriver} hitSlop={8}>
							<Ionicons name="close-circle" size={20} color={iconColor} />
						</Pressable>
					</View>
				)}

				{/* Scrollable Content */}
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: insets.bottom + space[6] },
					]}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					nestedScrollEnabled={false}
				>
					{/* Input Fields Container */}
					<View style={styles.inputsContainer}>
						{/* Origin Input */}
						<View style={styles.inputWrapper}>
							<View style={styles.inputRow}>
								<View style={styles.inputFieldContainer}>
									<View
										style={[
											styles.inputWithIcon,
											{
												backgroundColor: surfaceColor,
												borderColor: isOriginFocused ? tintColor : borderColor,
												borderWidth: 1,
											},
										]}
									>
										<Ionicons
											name="search"
											size={20}
											color={iconColor}
											style={styles.inputIcon}
										/>
										<TextInput
											ref={originAutocompleteRef}
											style={[styles.input, { color: textColor }]}
											placeholder="Pickup location"
											placeholderTextColor={secondaryTextColor}
											value={originInput}
											onChangeText={handleOriginChange}
											onFocus={() => setIsOriginFocused(true)}
											onBlur={() => {
												setIsOriginFocused(false);
												setTimeout(() => setOriginSuggestions([]), 150);
											}}
											returnKeyType="search"
											autoCapitalize="none"
											autoCorrect={false}
										/>
										{/* Clear Button - Only show when location is selected */}
										{origin && (
											<Pressable
												onPress={() => {
													setOrigin(null);
													setOriginInput("");
													setOriginSuggestions([]);
												}}
												hitSlop={8}
												style={styles.clearButton}
											>
												<Ionicons
													name="close-circle"
													size={20}
													color={iconColor}
												/>
											</Pressable>
										)}
									</View>
									{/* Loading Indicator */}
									{isOriginLoading && (
										<ActivityIndicator
											size="small"
											color={tintColor}
											style={styles.inputLoader}
										/>
									)}
								</View>
								{/* Time Icon Button */}
								<Pressable
									style={[
										styles.sideIconButton,
										{ borderColor, backgroundColor: surfaceColor },
									]}
									onPress={() => {
										// TODO: Implement time picker
									}}
								>
									<Ionicons name="time-outline" size={20} color={iconColor} />
								</Pressable>
							</View>
						</View>

						{/* Destination Input */}
						<View style={styles.inputWrapper}>
							<View style={styles.inputRow}>
								<View style={styles.inputFieldContainer}>
									<View
										style={[
											styles.inputWithIcon,
											{
												backgroundColor: surfaceColor,
												borderColor: isDestinationFocused
													? tintColor
													: borderColor,
												borderWidth: 1,
											},
										]}
									>
										<Ionicons
											name="search"
											size={20}
											color={iconColor}
											style={styles.inputIcon}
										/>
										<TextInput
											ref={destinationAutocompleteRef}
											style={[styles.input, { color: textColor }]}
											placeholder="Dropoff location"
											placeholderTextColor={secondaryTextColor}
											value={destinationInput}
											onChangeText={handleDestinationChange}
											onFocus={() => setIsDestinationFocused(true)}
											onBlur={() => {
												setIsDestinationFocused(false);
												setTimeout(() => setDestinationSuggestions([]), 150);
											}}
											returnKeyType="search"
											autoCapitalize="none"
											autoCorrect={false}
										/>
										{/* Clear Button - Only show when location is selected */}
										{destination && (
											<Pressable
												onPress={() => {
													setDestination(null);
													setDestinationInput("");
													setDestinationSuggestions([]);
												}}
												hitSlop={8}
												style={styles.clearButton}
											>
												<Ionicons
													name="close-circle"
													size={20}
													color={iconColor}
												/>
											</Pressable>
										)}
									</View>
									{/* Loading Indicator */}
									{isDestinationLoading && (
										<ActivityIndicator
											size="small"
											color={tintColor}
											style={styles.inputLoader}
										/>
									)}
								</View>
								{/* Swap Icon Button */}
								<Pressable
									style={[
										styles.sideIconButton,
										{ borderColor, backgroundColor: surfaceColor },
									]}
									onPress={handleSwap}
								>
									<Ionicons name="swap-vertical" size={20} color={iconColor} />
								</Pressable>
							</View>
						</View>
					</View>

					{/* Continue Button - Only show when both locations selected */}
					{origin && destination && (
						<View style={styles.continueButtonContainer}>
							<Pressable
								onPress={handleContinue}
								style={[styles.continueButton, { backgroundColor: tintColor }]}
							>
								<Text style={styles.continueButtonText}>
									Continue
								</Text>
							</Pressable>
						</View>
					)}
				</ScrollView>

				{/* Origin Suggestions Dropdown - Rendered outside ScrollView to avoid nesting warning */}
				{(originSuggestions.length > 0 ||
					showOriginEmpty ||
					originSearchError) && (
					<View
						style={[
							styles.suggestionsContainer,
							styles.originSuggestionsPosition,
							{ backgroundColor: surfaceColor, borderColor },
						]}
					>
						{originSearchError ? (
							<Pressable
								style={styles.emptyStateContainer}
								onPress={() => searchPlaces(originInput, true)}
							>
								<Ionicons
									name="alert-circle-outline"
									size={24}
									color={iconColor}
								/>
								<Text style={styles.emptyStateText}>
									Couldn&apos;t load results
								</Text>
								<Text
									style={[styles.emptyStateSubtext, { color: iconColor }]}
								>
									Check connection and try again
								</Text>
							</Pressable>
						) : showOriginEmpty ? (
							<View style={styles.emptyStateContainer}>
								<Ionicons name="search-outline" size={24} color={iconColor} />
								<Text style={styles.emptyStateText}>
									No results found
								</Text>
								<Text
									style={[styles.emptyStateSubtext, { color: iconColor }]}
								>
									Try a broader search
								</Text>
							</View>
						) : (
							<FlatList
								data={originSuggestions}
								keyExtractor={(item) => item.placeId}
								renderItem={renderSuggestionItem}
								ItemSeparatorComponent={() => (
									<View
										style={[
											styles.suggestionSeparator,
											{ backgroundColor: borderColor },
										]}
									/>
								)}
								keyboardShouldPersistTaps="handled"
								initialNumToRender={8}
								maxToRenderPerBatch={10}
								windowSize={7}
							/>
						)}
					</View>
				)}

				{/* Destination Suggestions Dropdown - Rendered outside ScrollView to avoid nesting warning */}
				{(destinationSuggestions.length > 0 ||
					showDestinationEmpty ||
					destinationSearchError) && (
					<View
						style={[
							styles.suggestionsContainer,
							styles.destinationSuggestionsPosition,
							{ backgroundColor: surfaceColor, borderColor },
						]}
					>
						{destinationSearchError ? (
							<Pressable
								style={styles.emptyStateContainer}
								onPress={() => searchPlaces(destinationInput, false)}
							>
								<Ionicons
									name="alert-circle-outline"
									size={24}
									color={iconColor}
								/>
								<Text style={styles.emptyStateText}>
									Couldn&apos;t load results
								</Text>
								<Text
									style={[styles.emptyStateSubtext, { color: iconColor }]}
								>
									Check connection and try again
								</Text>
							</Pressable>
						) : showDestinationEmpty ? (
							<View style={styles.emptyStateContainer}>
								<Ionicons name="search-outline" size={24} color={iconColor} />
								<Text style={styles.emptyStateText}>
									No results found
								</Text>
								<Text
									style={[styles.emptyStateSubtext, { color: iconColor }]}
								>
									Try a broader search
								</Text>
							</View>
						) : (
							<FlatList
								data={destinationSuggestions}
								keyExtractor={(item) => item.placeId}
								renderItem={renderSuggestionItem}
								ItemSeparatorComponent={() => (
									<View
										style={[
											styles.suggestionSeparator,
											{ backgroundColor: borderColor },
										]}
									/>
								)}
								keyboardShouldPersistTaps="handled"
								initialNumToRender={8}
								maxToRenderPerBatch={10}
								windowSize={7}
							/>
						)}
					</View>
				)}
			</KeyboardAvoidingView>
		);
	}

	// Loading or Preview State
	return (
		<GestureHandlerRootView style={styles.container}>
			<View style={[styles.container, { backgroundColor }]}>
				{/* Map */}
				<MapView
					ref={mapRef}
					style={styles.map}
					initialRegion={SINT_MAARTEN_REGION}
					showsUserLocation
					showsMyLocationButton={false}
					showsCompass={false}
				>
					{/* Origin Marker */}
					{origin && (
						<Marker
							coordinate={origin.coordinates}
							title={origin.name}
							pinColor={tintColor}
						/>
					)}

					{/* Destination Marker */}
					{destination && (
						<Marker
							coordinate={destination.coordinates}
							title={destination.name}
							pinColor={tintColor}
						/>
					)}

					{/* Route Polyline (from proxied Directions API) */}
					{routeData?.coordinates?.length ? (
						<Polyline
							coordinates={routeData.coordinates}
							strokeWidth={4}
							strokeColor={tintColor}
						/>
					) : null}
				</MapView>

				{/* Close Button */}
				<View style={[styles.closeButtonContainer, { top: insets.top + 12 }]}>
					<Pressable
						onPress={handleClose}
						style={[styles.closeButton, { backgroundColor: surfaceColor }]}
						hitSlop={8}
					>
						<Ionicons name="close" size={24} color={textColor} />
					</Pressable>
				</View>

				{/* Route Details Bottom Sheet */}
				<BottomSheet
					ref={bottomSheetRef}
					index={0}
					snapPoints={snapPoints}
					backgroundStyle={[
						styles.bottomSheetBackground,
						{ backgroundColor: surfaceColor },
					]}
					handleIndicatorStyle={[
						styles.handleIndicator,
						{ backgroundColor: handleIndicatorColor },
					]}
					enablePanDownToClose={false}
				>
					<BottomSheetView
						style={[
							styles.bottomSheetContent,
							{ paddingBottom: insets.bottom + space[6] },
						]}
					>
						{/* Loading State */}
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={tintColor} />
							<Text
								style={[styles.loadingText, { color: secondaryTextColor }]}
							>
								Finding best route...
							</Text>
						</View>
					</BottomSheetView>
				</BottomSheet>
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
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: space[5],
		paddingBottom: space[3],
	},
	headerTitle: {
		fontSize: Typography.sizes.h4,
		fontWeight: Typography.weights.semiBold,
	},
	driverBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
		paddingHorizontal: space[5],
		paddingVertical: space[3],
		borderBottomWidth: 1,
	},
	driverInfo: {
		flex: 1,
	},
	driverName: {
		fontSize: Typography.sizes.bodySmall,
		fontWeight: Typography.weights.semiBold,
	},
	driverMeta: {
		fontSize: Typography.sizes.caption,
		marginTop: 2,
	},
	inputsContainer: {
		paddingHorizontal: space[5],
	},
	inputWrapper: {
		marginBottom: space[4],
	},
	label: {
		fontSize: Typography.sizes.bodySmall,
		fontWeight: Typography.weights.medium,
		marginBottom: space[2],
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[3],
	},
	inputFieldContainer: {
		flex: 1,
	},
	inputWithIcon: {
		height: 48,
		borderRadius: radius.sm,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: space[4],
	},
	inputIcon: {
		marginRight: space[2],
	},
	input: {
		flex: 1,
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.semiBold,
		paddingVertical: 0,
	},
	clearButton: {
		marginLeft: space[2],
		padding: 2,
	},
	sideIconButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	suggestionsContainer: {
		position: "absolute",
		left: space[5],
		right: space[5],
		maxHeight: 300,
		borderRadius: radius.sm,
		borderWidth: 1,
		zIndex: 9999,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 10,
	},
	originSuggestionsPosition: {
		top: 144, // Header (60) + padding (20) + origin input (64) = 144
	},
	destinationSuggestionsPosition: {
		top: 228, // Header (60) + padding (20) + origin input (64) + gap (20) + destination input (64) = 228
	},
	suggestionItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: space[4],
		minHeight: 58,
		gap: space[3],
	},
	suggestionIcon: {
		marginTop: 2,
	},
	suggestionContent: {
		flex: 1,
	},
	suggestionMainText: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
		marginBottom: space[1],
	},
	suggestionSecondaryText: {
		fontSize: Typography.sizes.bodySmall,
	},
	suggestionSeparator: {
		height: StyleSheet.hairlineWidth,
	},
	emptyStateContainer: {
		height: 56,
		paddingHorizontal: space[4],
		paddingVertical: space[3],
		justifyContent: "center",
		alignItems: "center",
		gap: space[1],
	},
	emptyStateText: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
		textAlign: "center",
	},
	emptyStateSubtext: {
		fontSize: Typography.sizes.bodySmall,
		fontWeight: Typography.weights.regular,
		textAlign: "center",
	},
	inputLoader: {
		position: "absolute",
		right: space[4],
		top: 12,
	},
	closeButtonContainer: {
		position: "absolute",
		left: 20,
	},
	closeButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	bottomSheetBackground: {
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -4,
		},
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
	},
	handleIndicator: {
		width: 40,
		height: 4,
		borderRadius: 2,
		marginTop: space[2],
	},
	bottomSheetContent: {
		paddingHorizontal: space[6],
		paddingBottom: space[6],
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: space[4],
	},
	loadingText: {
		fontSize: Typography.sizes.body,
	},
	routeInfo: {
		marginBottom: space[5],
	},
	routePoint: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: space[1],
	},
	dot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: space[3],
	},
	routeLine: {
		width: 2,
		height: 20,
		marginLeft: 5,
		marginVertical: 2,
	},
	routeText: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
	},
	tripDetails: {
		flexDirection: "row",
		gap: space[6],
		marginBottom: space[5],
	},
	detailItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: space[2],
	},
	detailText: {
		fontSize: Typography.sizes.bodySmall,
	},
	priceContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: space[5],
		paddingVertical: space[4],
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	priceLabel: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
		lineHeight: Typography.sizes.body * 1.5,
	},
	price: {
		fontSize: Typography.sizes.h2,
		fontWeight: Typography.weights.bold,
		lineHeight: Typography.sizes.h2 * 1.2,
	},
	continueButton: {
		paddingVertical: space[4],
		borderRadius: radius.md,
		alignItems: "center",
		justifyContent: "center",
	},
	continueButtonText: {
		color: colors.bg,
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.semiBold,
	},
	continueButtonContainer: {
		paddingHorizontal: space[5],
		paddingVertical: space[4],
	},
});
