import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
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
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { SINT_MAARTEN_REGION } from "@/constants/config";
import {
	BorderRadius,
	Colors,
	Spacing,
	Typography,
} from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
	googleMapsService,
	type PlaceResult,
} from "@/services/google-maps.service";
import { useRouteStore } from "@/store/route-store";
import {
	calculatePrice,
	formatDistance,
	formatDuration,
	formatPrice,
} from "@/utils/pricing";

type ViewState = "input" | "loading" | "preview";

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
	highlightColor = Colors.primary,
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
	const bottomSheetRef = useRef<BottomSheet>(null);
	const mapRef = useRef<MapView>(null);
	const originAutocompleteRef = useRef<TextInput>(null);
	const destinationAutocompleteRef = useRef<TextInput>(null);
	const hasCalculatedRoute = useRef(false);

	const {
		origin,
		destination,
		routeData,
		setOrigin,
		setDestination,
		setRouteData,
		setError,
		swapLocations,
	} = useRouteStore();

	const [viewState, setViewState] = useState<ViewState>("input");
	const [isOriginFocused, setIsOriginFocused] = useState(false);
	const [isDestinationFocused, setIsDestinationFocused] = useState(false);

	// Custom autocomplete state
	const [originInput, setOriginInput] = useState("");
	const [destinationInput, setDestinationInput] = useState("");
	const [originSuggestions, setOriginSuggestions] = useState<PlaceResult[]>([]);
	const [destinationSuggestions, setDestinationSuggestions] = useState<
		PlaceResult[]
	>([]);
	const [isOriginLoading, setIsOriginLoading] = useState(false);
	const [isDestinationLoading, setIsDestinationLoading] = useState(false);
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

	const handleClose = useCallback(() => {
		router.back();
	}, [router]);

	const handleContinue = useCallback(() => {
		// #region agent log
		fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:163',message:'MANUAL Continue button pressed - navigating to trip-preview',data:{hypothesisId:'H6',navigationType:'manual-push',viewState,hasRouteData:!!routeData,hasOrigin:!!origin,hasDestination:!!destination},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
		// #endregion
		router.push("/trip-preview");
	}, [router, viewState, routeData, origin, destination]);

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
			if (isOrigin) setOriginSuggestions([]);
			else setDestinationSuggestions([]);
			return;
		}

		if (isOrigin) setIsOriginLoading(true);
		else setIsDestinationLoading(true);

		try {
			const results = await googleMapsService.searchPlaces(query);
			// #region agent log
			fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:189',message:'Autocomplete results received',data:{hypothesisId:'H2',isOrigin,query,resultsCount:results.length,willTriggerFlatListRender:results.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
			// #endregion
			if (isOrigin) setOriginSuggestions(results);
			else setDestinationSuggestions(results);
		} catch (error) {
			console.error("[route-input] Autocomplete error:", error);
			if (isOrigin) setOriginSuggestions([]);
			else setDestinationSuggestions([]);
		} finally {
			if (isOrigin) setIsOriginLoading(false);
			else setIsDestinationLoading(false);
		}
	}, []);

	// Handle text input change with debounce
	const handleOriginChange = useCallback(
		(text: string) => {
			setOriginInput(text);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => searchPlaces(text, true), 250);
		},
		[searchPlaces],
	);

	const handleDestinationChange = useCallback(
		(text: string) => {
			setDestinationInput(text);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => searchPlaces(text, false), 250);
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

	// Auto-navigate to trip preview when route is calculated
	// Only navigate if we actually calculated a route (not just pre-filled from home carousel)
	useEffect(() => {
		if (viewState === "preview" && routeData && origin && destination && hasCalculatedRoute.current) {
			// #region agent log
			fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:263',message:'Auto-navigation effect triggered - will navigate in 500ms',data:{hypothesisId:'H5',viewState,hasRouteData:!!routeData,hasOrigin:!!origin,hasDestination:!!destination,routeDataComplete:{distance:routeData?.distance,duration:routeData?.duration,price:routeData?.price,coordsCount:routeData?.coordinates?.length}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
			// #endregion
			// Small delay to ensure route data is fully set
			const timer = setTimeout(() => {
				// #region agent log
				fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:270',message:'AUTO-NAVIGATION EXECUTING NOW - navigating to trip-preview',data:{hypothesisId:'H5',navigationType:'auto-replace'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
				// #endregion
				// This is effectively a state-driven redirect; replace avoids stacking duplicates
				// if the effect re-triggers.
				router.replace("/trip-preview");
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [viewState, routeData, origin, destination, router]);

	// Fetch route via proxied Directions API when entering loading state
	useEffect(() => {
		let cancelled = false;

		const fetchRoute = async () => {
			if (viewState !== "loading") return;
			if (!origin || !destination) return;

			setError(null);
			setRouteData(null);

			try {
				const directions = await googleMapsService.getDirections(
					origin.coordinates,
					destination.coordinates,
				);

				const route = directions.routes?.[0];
				const leg = route?.legs?.[0];
				const encoded = route?.overview_polyline?.points;

				if (!leg || !encoded) {
					throw new Error("Directions response missing route data");
				}

				const distanceKm = (leg.distance?.value ?? 0) / 1000;
				const durationMin = (leg.duration?.value ?? 0) / 60;
				const coords = googleMapsService.decodePolyline(encoded);

				const price = calculatePrice(distanceKm, durationMin);

				// #region agent log
				fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:292',message:'Route calculated from Google Directions API',data:{hypothesisId:'H2',originName:origin?.name,destinationName:destination?.name,distanceMeters:leg.distance?.value,distanceKm:distanceKm,durationSeconds:leg.duration?.value,durationMin:durationMin,calculatedPrice:price,coordinatesCount:coords.length,formattedDistance:formatDistance(distanceKm),formattedDuration:formatDuration(durationMin),formattedPrice:formatPrice(price)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
				// #endregion

				if (cancelled) return;

				setRouteData({
					distance: distanceKm,
					duration: durationMin,
					price,
					coordinates: coords,
				});

				// Fit map to show entire route
				if (mapRef.current && coords.length) {
					mapRef.current.fitToCoordinates(coords, {
						edgePadding: {
							top: 100,
							right: 50,
							bottom: 400, // Account for bottom sheet
							left: 50,
						},
						animated: true,
					});
				}

				// Mark that we've calculated a route (not just pre-filled)
				hasCalculatedRoute.current = true;
				setViewState("preview");
			} catch (e: unknown) {
				const message =
					e instanceof Error ? e.message : "Failed to fetch directions";
				console.error("[route-input] Directions error:", e);
				if (cancelled) return;
				setError(message);
				setViewState("input");
			}
		};

		fetchRoute();

		return () => {
			cancelled = true;
		};
	}, [viewState, origin, destination, setError, setRouteData]);

	// Sync input text with store values on mount/change
	// Don't include input values in deps to avoid clearing auto-filled values
	useEffect(() => {
		if (origin && !originInput) {
			setOriginInput(origin.name);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [origin]);

	useEffect(() => {
		if (destination && !destinationInput) {
			setDestinationInput(destination.name);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [destination]);

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
							style={[styles.suggestionSecondaryText, { color: secondaryTextColor }]}
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
		// #region agent log
		fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:413',message:'Input view rendering',data:{hypothesisId:'H1',hasOriginSuggestions:originSuggestions.length>0,originSuggestionsCount:originSuggestions.length,hasDestinationSuggestions:destinationSuggestions.length>0,destinationSuggestionsCount:destinationSuggestions.length,isScrollViewRendered:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
		// #endregion
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
					<ThemedText style={styles.headerTitle}>Your route</ThemedText>
					<View style={{ width: 28 }} />
				</View>

				{/* Scrollable Content */}
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: insets.bottom + Spacing.xxl }
					]}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Input Fields Container */}
					<View style={styles.inputsContainer}>
					{/* Origin Input with Clock Icon */}
					<View style={styles.inputWrapper}>
						<View style={styles.inputRow}>
							<View style={styles.inputFieldContainer}>
								<View
									style={[
										styles.inputWithIcon,
										{
											backgroundColor: surfaceColor,
											borderColor: isOriginFocused ? tintColor : borderColor,
											borderWidth: isOriginFocused ? 2 : 1,
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
											<Ionicons name="close-circle" size={20} color={iconColor} />
										</Pressable>
									)}
								</View>
							{/* Origin Suggestions Dropdown */}
							{originSuggestions.length > 0 && (
								<View
									style={[
										styles.suggestionsContainer,
										{ backgroundColor: surfaceColor, borderColor },
									]}
								>
									{/* #region agent log */}
									{(() => { fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:491',message:'Origin FlatList rendering inside ScrollView',data:{hypothesisId:'H1,H2,H4',suggestionCount:originSuggestions.length,nestedScrollEnabled:true,parentContainer:'ScrollView',positioning:'absolute'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{}); return null; })()}
									{/* #endregion */}
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
									/>
								</View>
							)}
								{/* Loading Indicator */}
								{isOriginLoading && (
									<ActivityIndicator
										size="small"
										color={tintColor}
										style={styles.inputLoader}
									/>
								)}
							</View>
							<View
								style={[
									styles.sideIconButton,
									{ backgroundColor: surfaceColor, borderColor: borderColor },
								]}
							>
								<Ionicons name="time-outline" size={20} color={iconColor} />
							</View>
						</View>
					</View>

					{/* Destination Input with Swap Button */}
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
											borderWidth: isDestinationFocused ? 2 : 1,
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
											<Ionicons name="close-circle" size={20} color={iconColor} />
										</Pressable>
									)}
								</View>
							{/* Destination Suggestions Dropdown */}
							{destinationSuggestions.length > 0 && (
								<View
									style={[
										styles.suggestionsContainer,
										{ backgroundColor: surfaceColor, borderColor },
									]}
								>
									{/* #region agent log */}
									{(() => { fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route-input.tsx:586',message:'Destination FlatList rendering inside ScrollView',data:{hypothesisId:'H1,H2,H4',suggestionCount:destinationSuggestions.length,nestedScrollEnabled:true,parentContainer:'ScrollView',positioning:'absolute'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{}); return null; })()}
									{/* #endregion */}
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
									/>
								</View>
							)}
								{/* Loading Indicator */}
								{isDestinationLoading && (
									<ActivityIndicator
										size="small"
										color={tintColor}
										style={styles.inputLoader}
									/>
								)}
							</View>
							<Pressable
								onPress={handleSwap}
								style={[
									styles.sideIconButton,
									{ backgroundColor: surfaceColor, borderColor: borderColor },
								]}
								hitSlop={8}
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
								onPress={() => {
									Keyboard.dismiss();
									setViewState("loading");
								}}
								style={[styles.continueButton, { backgroundColor: tintColor }]}
							>
								<ThemedText style={styles.continueButtonText}>
									Continue
								</ThemedText>
							</Pressable>
						</View>
					)}
				</ScrollView>
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
							pinColor="#FF5733"
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
					snapPoints={["45%"]}
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
					<BottomSheetView style={styles.bottomSheetContent}>
						{viewState === "loading" ? (
							// Loading State
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" color={tintColor} />
								<ThemedText
									style={[styles.loadingText, { color: secondaryTextColor }]}
								>
									Finding best route...
								</ThemedText>
							</View>
						) : (
							// Preview State
							<>
								{/* Route Info */}
								<View style={styles.routeInfo}>
									<View style={styles.routePoint}>
										<View
											style={[styles.dot, { backgroundColor: tintColor }]}
										/>
										<ThemedText style={styles.routeText}>
											{origin?.name || "Origin"}
										</ThemedText>
									</View>
									<View
										style={[styles.routeLine, { backgroundColor: borderColor }]}
									/>
									<View style={styles.routePoint}>
										<View
											style={[styles.dot, { backgroundColor: "#FF5733" }]}
										/>
										<ThemedText style={styles.routeText}>
											{destination?.name || "Destination"}
										</ThemedText>
									</View>
								</View>

								{/* Trip Details */}
								<View style={styles.tripDetails}>
									<View style={styles.detailItem}>
										<Ionicons
											name="time-outline"
											size={20}
											color={secondaryTextColor}
										/>
										<ThemedText
											style={[styles.detailText, { color: secondaryTextColor }]}
										>
											{routeData
												? formatDuration(routeData.duration)
												: "~15 min"}
										</ThemedText>
									</View>
									<View style={styles.detailItem}>
										<Ionicons
											name="car-outline"
											size={20}
											color={secondaryTextColor}
										/>
										<ThemedText
											style={[styles.detailText, { color: secondaryTextColor }]}
										>
											{routeData
												? formatDistance(routeData.distance)
												: "5.2 km"}
										</ThemedText>
									</View>
								</View>

								{/* Price */}
								<View style={[styles.priceContainer, { borderColor }]}>
									<ThemedText style={styles.priceLabel}>
										Estimated fare
									</ThemedText>
									<ThemedText style={styles.price}>
										{routeData ? formatPrice(routeData.price) : "$42"}
									</ThemedText>
								</View>

								{/* Continue Button */}
								<Pressable
									onPress={handleContinue}
									style={[
										styles.continueButton,
										{ backgroundColor: tintColor },
									]}
								>
									<ThemedText style={styles.continueButtonText}>
										Continue
									</ThemedText>
								</Pressable>
							</>
						)}
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
		paddingHorizontal: Spacing.xl,
		paddingBottom: Spacing.md,
	},
	headerTitle: {
		fontSize: Typography.sizes.h4,
		fontWeight: Typography.weights.semiBold,
	},
	inputsContainer: {
		paddingHorizontal: Spacing.xl,
	},
	inputWrapper: {
		marginBottom: Spacing.lg,
	},
	label: {
		fontSize: Typography.sizes.bodySmall,
		fontWeight: Typography.weights.medium,
		marginBottom: Spacing.sm,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	inputFieldContainer: {
		flex: 1,
	},
	inputWithIcon: {
		height: 48,
		borderRadius: BorderRadius.input,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing.lg,
	},
	inputIcon: {
		marginRight: Spacing.sm,
	},
	input: {
		flex: 1,
		fontSize: Typography.sizes.body,
		paddingVertical: 0,
	},
	clearButton: {
		marginLeft: Spacing.sm,
		padding: 2,
	},
	sideIconButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	suggestionsContainer: {
		position: "absolute",
		top: 52,
		left: 0,
		right: 0,
		maxHeight: 300,
		borderRadius: BorderRadius.input,
		borderWidth: 1,
		zIndex: 9999,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 10,
	},
	suggestionItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: Spacing.lg,
		minHeight: 58,
		gap: Spacing.md,
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
		marginBottom: Spacing.xs,
	},
	suggestionSecondaryText: {
		fontSize: Typography.sizes.bodySmall,
	},
	suggestionSeparator: {
		height: StyleSheet.hairlineWidth,
	},
	inputLoader: {
		position: "absolute",
		right: Spacing.lg,
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
		borderTopLeftRadius: BorderRadius.sheet,
		borderTopRightRadius: BorderRadius.sheet,
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
		marginTop: Spacing.sm,
	},
	bottomSheetContent: {
		paddingHorizontal: Spacing.xxl,
		paddingBottom: Spacing.xxl,
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: Spacing.lg,
	},
	loadingText: {
		fontSize: Typography.sizes.body,
	},
	routeInfo: {
		marginBottom: Spacing.xl,
	},
	routePoint: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: Spacing.xs,
	},
	dot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginRight: Spacing.md,
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
		gap: Spacing.xxl,
		marginBottom: Spacing.xl,
	},
	detailItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.sm,
	},
	detailText: {
		fontSize: Typography.sizes.bodySmall,
	},
	priceContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: Spacing.xl,
		paddingVertical: Spacing.md,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	priceLabel: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
	},
	price: {
		fontSize: Typography.sizes.h2,
		fontWeight: Typography.weights.bold,
	},
	continueButton: {
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
		alignItems: "center",
		justifyContent: "center",
	},
	continueButtonText: {
		color: Colors.surface,
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.semiBold,
	},
	continueButtonContainer: {
		paddingHorizontal: Spacing.xl,
		paddingVertical: Spacing.lg,
	},
});
