import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	FlatList,
	Image,
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
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { SINT_MAARTEN_LOCATION } from "@/constants/config";
import {
	BorderRadius,
	Colors,
	Spacing,
	Typography,
} from "@/constants/design-tokens";
import {
	googleMapsService,
	type PlaceResult,
} from "@/services/google-maps.service";
import { useLocationStore } from "@/store/location-store";
import type { PlaceDetails } from "@/store/route-store";
import { useRouteStore } from "@/store/route-store";

// #region agent log
const DEBUG_LOG = (
	location: string,
	message: string,
	data: {
		hypothesisId?: string;
		[k: string]: unknown;
	},
) => {
	fetch("http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location,
			message,
			data,
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "run1",
			hypothesisId: data.hypothesisId || "A",
		}),
	}).catch(() => {});
};
// #endregion

const BRAND_GREEN = Colors.primary;
const BORDER_GRAY = "#E0E0E0";

type Field = "origin" | "destination";

type PopularLocation = {
	id: string;
	title: string;
	subtitle: string;
	imageUrl: string;
	// Prefer placeId for accuracy; can fall back to title search
	placeId?: string;
	searchText: string;
};

const POPULAR_LOCATIONS: PopularLocation[] = [
	{
		id: "maho",
		title: "Maho Beach",
		subtitle: "Beacon Hill Rd, Sint Maarten",
		imageUrl:
			"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=70",
		searchText: "Maho Beach, Sint Maarten",
	},
	{
		id: "pjia",
		title: "Princess Juliana Airport",
		subtitle: "Simpson Bay, Sint Maarten",
		imageUrl:
			"https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=70",
		searchText: "Princess Juliana Airport, Sint Maarten",
	},
	{
		id: "philipsburg",
		title: "Philipsburg",
		subtitle: "Sint Maarten",
		imageUrl:
			"https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1600&q=70",
		searchText: "Philipsburg, Sint Maarten",
	},
];

export default function LocationPickerScreen() {
	const router = useRouter();
	const { origin, destination, setOrigin, setDestination } = useRouteStore();

	const [activeField, setActiveField] = useState<Field>("destination");
	const [originText, setOriginText] = useState(
		origin?.name || "Current Location",
	);
	const [destinationText, setDestinationText] = useState(
		destination?.name || "",
	);
	const [autocompleteItems, setAutocompleteItems] = useState<PlaceResult[]>([]);
	const [autocompleteLoading, setAutocompleteLoading] = useState(false);
	const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [carouselIndex, setCarouselIndex] = useState(0);

	const originInputRef = useRef<TextInput>(null);
	const destinationInputRef = useRef<TextInput>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// #region agent log
	useEffect(() => {
		const shouldShowButton = !!(origin && destination);
		DEBUG_LOG(
			"location-picker.tsx:19",
			"Component render - store values check",
			{
				hypothesisId: "B",
				origin: origin ? { placeId: origin.placeId, name: origin.name } : null,
				destination: destination
					? { placeId: destination.placeId, name: destination.name }
					: null,
				shouldShowButton,
				originTruthy: !!origin,
				destinationTruthy: !!destination,
			},
		);
	}, [origin, destination]);
	// #endregion

	// Use device GPS location if available, otherwise fall back to island center
	useEffect(() => {
		if (!origin && originText === "Current Location") {
			const storedLocation = useLocationStore.getState().currentLocation;

			const current: PlaceDetails = {
				placeId: storedLocation ? "device_location" : "current_location",
				name: "Current Location",
				description: storedLocation
					? "Your current location"
					: "Current Location",
				coordinates: storedLocation || { ...SINT_MAARTEN_LOCATION },
			};

			// #region agent log
			DEBUG_LOG(
				"location-picker.tsx:DEFAULT_ORIGIN",
				storedLocation
					? "Using device GPS location"
					: "Falling back to island center",
				{
					hypothesisId: "UI",
					hasGPS: !!storedLocation,
					coordinates: current.coordinates,
				},
			);
			// #endregion
			setOrigin(current);
		}
	}, [origin, originText, setOrigin]);

	useEffect(() => {
		const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
			setKeyboardHeight(e.endCoordinates?.height ?? 0);
		});
		const hideSub = Keyboard.addListener("keyboardDidHide", () => {
			setKeyboardHeight(0);
		});
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	const handleContinue = useCallback(() => {
		if (origin && destination) {
			Keyboard.dismiss();
			router.push("/route-input");
		}
	}, [origin, destination, router]);

	const isTyping = useMemo(() => {
		const t = activeField === "origin" ? originText : destinationText;
		return t.trim().length > 0 && t !== "Current Location";
	}, [activeField, destinationText, originText]);

	const runAutocomplete = useCallback(
		async (text: string) => {
			const q = text.trim();
			if (!q || q === "Current Location") {
				setAutocompleteItems([]);
				setAutocompleteError(null);
				return;
			}

			setAutocompleteLoading(true);
			setAutocompleteError(null);
			// #region agent log
			DEBUG_LOG("location-picker.tsx:AUTOCOMPLETE", "Searching places", {
				hypothesisId: "AC",
				field: activeField,
				queryLength: q.length,
			});
			// #endregion

			try {
				const results = await googleMapsService.searchPlaces(q);
				setAutocompleteItems(results);
				if (!results.length) {
					setAutocompleteError("No matches found");
				}
				// #region agent log
				DEBUG_LOG("location-picker.tsx:AUTOCOMPLETE_OK", "Places results", {
					hypothesisId: "AC",
					count: results.length,
				});
				// #endregion
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				setAutocompleteItems([]);
				setAutocompleteError(msg);
				console.error("[location-picker] Autocomplete error:", e);
				// #region agent log
				DEBUG_LOG(
					"location-picker.tsx:AUTOCOMPLETE_ERR",
					"Places search failed",
					{
						hypothesisId: "AC",
						error: msg,
					},
				);
				// #endregion
			} finally {
				setAutocompleteLoading(false);
			}
		},
		[activeField],
	);

	const onChangeText = useCallback(
		(field: Field, text: string) => {
			setActiveField(field);
			if (field === "origin") setOriginText(text);
			else setDestinationText(text);

			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => runAutocomplete(text), 250);
		},
		[runAutocomplete],
	);

	const applyPlaceToField = useCallback(
		async (field: Field, place: PlaceResult) => {
			Keyboard.dismiss();
			setAutocompleteItems([]);

			// #region agent log
			DEBUG_LOG("location-picker.tsx:APPLY_PLACE", "Applying selected place", {
				hypothesisId: "AC",
				field,
				placeId: place.placeId,
			});
			// #endregion

			try {
				const details = await googleMapsService.getPlaceDetails(place.placeId);
				const result = details?.result;
				const lat = result?.geometry?.location?.lat;
				const lng = result?.geometry?.location?.lng;
				if (typeof lat !== "number" || typeof lng !== "number") {
					throw new Error("Missing geometry in place details");
				}

				const placeDetails: PlaceDetails = {
					placeId: place.placeId,
					name: result?.name || place.mainText,
					description: result?.formatted_address || place.description,
					coordinates: { latitude: lat, longitude: lng },
				};

				if (field === "origin") {
					setOrigin(placeDetails);
					setOriginText(placeDetails.name);
					destinationInputRef.current?.focus();
				} else {
					setDestination(placeDetails);
					setDestinationText(placeDetails.name);
				}
			} catch (e: unknown) {
				// #region agent log
				DEBUG_LOG(
					"location-picker.tsx:APPLY_PLACE_ERR",
					"Place details failed",
					{
						hypothesisId: "AC",
						error: e instanceof Error ? e.message : String(e),
					},
				);
				// #endregion
			}
		},
		[setDestination, setOrigin],
	);

	const handleSwap = useCallback(() => {
		const temp = origin;
		setOrigin(destination);
		setDestination(temp);
		setOriginText(destination?.name || "");
		setDestinationText(temp?.name || "");
	}, [destination, origin, setDestination, setOrigin]);

	const handlePopularPress = useCallback(
		(item: PopularLocation) => {
			setActiveField("destination");
			setDestinationText(item.searchText);
			destinationInputRef.current?.focus();
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(
				() => runAutocomplete(item.searchText),
				0,
			);
		},
		[runAutocomplete],
	);

	const viewabilityConfig = useMemo(
		() => ({ itemVisiblePercentThreshold: 60 }),
		[],
	);
	const onViewableItemsChanged = useRef(
		({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
			const idx = viewableItems?.[0]?.index;
			if (typeof idx === "number") setCarouselIndex(idx);
		},
	).current;

	return (
		<>
			<Stack.Screen
				options={{
					title: "Route",
					headerBackTitle: "Home",
				}}
			/>
			<SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
				<KeyboardAvoidingView
					style={styles.container}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					keyboardVerticalOffset={0}
				>
					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.scrollContent}
						keyboardShouldPersistTaps="handled"
					>
						{/* Inputs Container */}
						<View style={styles.inputsContainer}>
					{/* Origin */}
					<Text style={styles.label}>Origin</Text>
					<View style={styles.row}>
						<View
							style={[
								styles.inputFieldWrapper,
								activeField === "origin"
									? styles.inputFieldWrapperActive
									: null,
							]}
						>
							<TextInput
								ref={originInputRef}
								value={originText}
								onChangeText={(t) => onChangeText("origin", t)}
								onFocus={() => setActiveField("origin")}
								placeholder="Current Location"
								placeholderTextColor={Colors.textSecondary}
								style={styles.textInput}
							/>
							<Pressable
								onPress={() => {
									setOrigin(null);
									setOriginText("");
								}}
								style={styles.inlineClear}
								hitSlop={8}
								accessible
								accessibilityRole="button"
								accessibilityLabel="Clear origin"
							>
								<Ionicons name="close" size={16} color={Colors.text} />
							</Pressable>
						</View>
						<View
							style={styles.sideIconButtonLight}
							accessible
							accessibilityLabel="Schedule"
						>
							<Ionicons
								name="time-outline"
								size={20}
								color={Colors.textSecondary}
							/>
						</View>
					</View>

					{/* Destination */}
					<Text style={[styles.label, { marginTop: Spacing.lg }]}>
						Destination
					</Text>
					<View style={styles.row}>
						<View
							style={[
								styles.inputFieldWrapper,
								activeField === "destination"
									? styles.inputFieldWrapperActive
									: null,
							]}
						>
							<TextInput
								ref={destinationInputRef}
								value={destinationText}
								onChangeText={(t) => onChangeText("destination", t)}
								onFocus={() => setActiveField("destination")}
								placeholder="Where to?"
								placeholderTextColor={Colors.textSecondary}
								style={styles.textInput}
								autoFocus
							/>
						</View>
						<Pressable
							onPress={handleSwap}
							style={styles.sideIconButtonLight}
							hitSlop={8}
							accessible
							accessibilityRole="button"
							accessibilityLabel="Swap origin and destination"
						>
							<Ionicons
								name="swap-vertical"
								size={20}
								color={Colors.textSecondary}
							/>
						</Pressable>
					</View>
				</View>

				{/* Popular Locations (Idle) */}
				{!isTyping && (
					<View style={styles.popularContainer}>
						<Text style={styles.popularHeader}>★ Popular locations</Text>
						<FlatList
							data={POPULAR_LOCATIONS}
							keyExtractor={(i) => i.id}
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.carouselContent}
							onViewableItemsChanged={onViewableItemsChanged}
							viewabilityConfig={viewabilityConfig}
							renderItem={({ item }) => (
								<Pressable
									onPress={() => handlePopularPress(item)}
									style={styles.card}
									accessible
									accessibilityRole="button"
									accessibilityLabel={`Popular location: ${item.title}`}
								>
									<Image
										source={{ uri: item.imageUrl }}
										style={styles.cardImage}
									/>
									<LinearGradient
										colors={["transparent", "rgba(0,0,0,0.55)"]}
										style={styles.cardOverlay}
									/>
									<View style={styles.cardText}>
										<Text style={styles.cardTitle}>{item.title}</Text>
										<Text style={styles.cardSubtitle}>{item.subtitle}</Text>
									</View>
								</Pressable>
							)}
						/>
						<View style={styles.dots}>
							{POPULAR_LOCATIONS.map((x, i) => (
								<View
									key={x.id}
									style={[
										styles.dot,
										i === carouselIndex ? styles.dotActive : null,
									]}
								/>
							))}
						</View>
					</View>
				)}

				{/* Continue Button (only when selected & not typing) */}
				{!isTyping && origin && destination && (
					<View style={styles.continueButtonContainer}>
						<Pressable
							onPress={handleContinue}
							style={styles.continueButton}
							accessible
							accessibilityRole="button"
							accessibilityLabel="Continue to trip preview"
						>
							<ThemedText style={styles.continueButtonText}>
								Continue
							</ThemedText>
						</Pressable>
					</View>
				)}
					</ScrollView>

				{/* Autocomplete list (typing state) */}
				{isTyping && (
					<View
						style={[styles.autocompleteOverlay, { bottom: keyboardHeight }]}
					>
						<View style={styles.autocompleteSheet}>
							<FlatList
								data={autocompleteItems}
								keyExtractor={(i) => i.placeId}
								keyboardShouldPersistTaps="handled"
								style={styles.autocompleteList}
								ListHeaderComponent={
									autocompleteLoading || autocompleteError ? (
										<Text style={styles.autocompleteMeta}>
											{autocompleteLoading
												? "Searching…"
												: `Error: ${autocompleteError}`}
										</Text>
									) : null
								}
								renderItem={({ item }) => (
									<Pressable
										onPress={() => applyPlaceToField(activeField, item)}
										style={styles.autocompleteRow}
									>
										<Ionicons
											name="location-outline"
											size={18}
											color={Colors.textSecondary}
											style={{ marginTop: 2 }}
										/>
										<View style={{ flex: 1 }}>
											<Text style={styles.autocompleteTitle}>
												{item.mainText}
											</Text>
											<Text style={styles.autocompleteSubtitle}>
												{item.secondaryText || item.description}
											</Text>
										</View>
									</Pressable>
								)}
								ListFooterComponent={
									<View style={styles.poweredBy}>
										<Text style={styles.poweredByText}>Powered by Google</Text>
									</View>
								}
							/>
						</View>
					</View>
				)}
				</KeyboardAvoidingView>
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: Colors.surface,
	},
	container: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: Spacing.xl,
	},
	inputsContainer: {
		paddingHorizontal: Spacing.xl,
		paddingBottom: Spacing.sm,
		zIndex: 1,
	},
	label: {
		fontSize: Typography.sizes.bodySmall,
		fontWeight: Typography.weights.medium,
		color: Colors.textSecondary,
		marginBottom: Spacing.sm,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	inputFieldWrapper: {
		flex: 1,
		height: 48,
		borderRadius: BorderRadius.input,
		borderWidth: 1,
		borderColor: BORDER_GRAY,
		backgroundColor: Colors.surface,
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: Spacing.lg,
		paddingRight: Spacing.sm,
	},
	inputFieldWrapperActive: {
		borderColor: BRAND_GREEN,
	},
	textInput: {
		flex: 1,
		fontSize: Typography.sizes.body,
		color: Colors.text,
		paddingVertical: 0,
	},
	inlineClear: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#ECEDEF",
		alignItems: "center",
		justifyContent: "center",
	},
	sideIconButtonLight: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 1,
		borderColor: BORDER_GRAY,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.surface,
	},
	popularContainer: {
		paddingHorizontal: Spacing.xl,
		paddingTop: Spacing.md,
	},
	popularHeader: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
		color: Colors.text,
		marginBottom: Spacing.md,
	},
	carouselContent: {
		paddingBottom: Spacing.sm,
	},
	card: {
		width: 320,
		height: 220,
		borderRadius: 18,
		overflow: "hidden",
		marginRight: Spacing.md,
	},
	cardImage: {
		width: "100%",
		height: "100%",
	},
	cardOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: 90,
	},
	cardText: {
		position: "absolute",
		left: Spacing.lg,
		right: Spacing.lg,
		bottom: Spacing.lg,
	},
	cardTitle: {
		color: "#FFFFFF",
		fontSize: 26,
		fontWeight: "700",
	},
	cardSubtitle: {
		color: "rgba(255,255,255,0.9)",
		fontSize: Typography.sizes.body,
		marginTop: 4,
	},
	dots: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
		marginTop: Spacing.sm,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#D0D3D7",
	},
	dotActive: {
		backgroundColor: BRAND_GREEN,
	},
	continueButtonContainer: {
		paddingHorizontal: Spacing.xl,
		paddingVertical: Spacing.lg,
		zIndex: 0,
	},
	continueButton: {
		width: "100%",
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: Colors.primary,
	},
	continueButtonText: {
		color: Colors.surface,
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.semiBold,
	},
	autocompleteOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
	},
	autocompleteSheet: {
		paddingHorizontal: Spacing.xl,
		paddingBottom: Spacing.md,
	},
	autocompleteList: {
		maxHeight: 240,
		backgroundColor: Colors.surface,
		borderRadius: BorderRadius.input,
		borderWidth: 1,
		borderColor: BORDER_GRAY,
	},
	autocompleteMeta: {
		padding: Spacing.md,
		color: Colors.textSecondary,
		fontSize: Typography.sizes.bodySmall,
	},
	autocompleteRow: {
		flexDirection: "row",
		gap: 12,
		paddingVertical: Spacing.md,
		paddingHorizontal: Spacing.md,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(0,0,0,0.08)",
	},
	autocompleteTitle: {
		fontSize: Typography.sizes.body,
		color: Colors.text,
		fontWeight: Typography.weights.medium,
	},
	autocompleteSubtitle: {
		fontSize: Typography.sizes.bodySmall,
		color: Colors.textSecondary,
		marginTop: 2,
	},
	poweredBy: {
		padding: Spacing.md,
		alignItems: "center",
	},
	poweredByText: {
		fontSize: Typography.sizes.bodySmall,
		color: Colors.textSecondary,
	},
});
