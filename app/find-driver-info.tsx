import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRouteStore } from "@/store/route-store";
import { formatDistance, formatDuration, formatPrice } from "@/utils/pricing";

export default function FindDriverInfoScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { origin, destination, routeData } = useRouteStore();

	const backgroundColor = useThemeColor(
		{ light: "#FFFFFF", dark: "#161616" },
		"background",
	);
	const textColor = useThemeColor({ light: "#262626", dark: "#E5E7EA" }, "text");
	const secondaryTextColor = useThemeColor(
		{ light: "#5C5F62", dark: "#8B8F95" },
		"textSecondary",
	);
	const tintColor = useThemeColor({}, "tint");
	const borderColor = useThemeColor(
		{ light: "#E3E6E3", dark: "#2F3237" },
		"border",
	);

	const handleNext = useCallback(() => {
		router.push("/(tabs)/drivers");
	}, [router]);

	const handleBack = useCallback(() => {
		router.back();
	}, [router]);

	return (
		<ThemedView style={[styles.container, { backgroundColor }]}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 12 }]}>
				<Pressable
					onPress={handleBack}
					hitSlop={8}
					accessible
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
					<Ionicons name="arrow-back" size={24} color={textColor} />
				</Pressable>
			</View>

			{/* Content */}
			<View style={styles.content}>
				{/* Success Icon */}
				<View style={[styles.iconContainer, { backgroundColor: tintColor }]}>
					<Ionicons name="checkmark" size={64} color="#FFFFFF" />
				</View>

				{/* Success Message */}
				<ThemedText style={styles.title}>Quote Saved!</ThemedText>
				<ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
					Your trip quote has been saved to your history
				</ThemedText>

				{/* Route Summary */}
				{origin && destination && routeData && (
					<View style={[styles.summaryCard, { borderColor }]}>
						<View style={styles.routeRow}>
							<Ionicons name="location" size={20} color={tintColor} />
							<View style={styles.routeInfo}>
								<ThemedText style={styles.routeLabel}>From</ThemedText>
								<ThemedText style={styles.routeName} numberOfLines={1}>
									{origin.name}
								</ThemedText>
							</View>
						</View>

						<View style={[styles.routeDivider, { backgroundColor: borderColor }]} />

						<View style={styles.routeRow}>
							<Ionicons name="location" size={20} color="#FF5733" />
							<View style={styles.routeInfo}>
								<ThemedText style={styles.routeLabel}>To</ThemedText>
								<ThemedText style={styles.routeName} numberOfLines={1}>
									{destination.name}
								</ThemedText>
							</View>
						</View>

						<View style={[styles.statsRow, { borderTopColor: borderColor }]}>
							<View style={styles.stat}>
								<Ionicons name="time-outline" size={18} color={secondaryTextColor} />
								<ThemedText style={[styles.statText, { color: secondaryTextColor }]}>
									{formatDuration(routeData.duration)}
								</ThemedText>
							</View>
							<View style={styles.stat}>
								<Ionicons name="car-outline" size={18} color={secondaryTextColor} />
								<ThemedText style={[styles.statText, { color: secondaryTextColor }]}>
									{formatDistance(routeData.distance)}
								</ThemedText>
							</View>
							<View style={styles.stat}>
								<ThemedText style={styles.price}>
									{formatPrice(routeData.price)}
								</ThemedText>
							</View>
						</View>
					</View>
				)}

				{/* Explanation */}
				<View style={styles.explanationContainer}>
					<Ionicons
						name="information-circle-outline"
						size={24}
						color={secondaryTextColor}
					/>
					<ThemedText style={[styles.explanation, { color: secondaryTextColor }]}>
						We'll help you find an available driver for your trip. Browse our
						verified drivers and contact them directly.
					</ThemedText>
				</View>
			</View>

			{/* Next Button */}
			<View
				style={[
					styles.footer,
					{ paddingBottom: Math.max(insets.bottom, Spacing.lg) },
				]}
			>
				<Pressable
					onPress={handleNext}
					style={[styles.nextButton, { backgroundColor: tintColor }]}
					accessible
					accessibilityRole="button"
					accessibilityLabel="Browse drivers"
				>
					<ThemedText style={styles.nextButtonText}>Browse Drivers</ThemedText>
					<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
				</Pressable>
			</View>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: Spacing.lg,
		paddingBottom: Spacing.md,
	},
	content: {
		flex: 1,
		paddingHorizontal: Spacing.xl,
		paddingTop: Spacing.xxl,
		alignItems: "center",
	},
	iconContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: Spacing.xl,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		marginBottom: Spacing.sm,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		textAlign: "center",
		marginBottom: Spacing.xxl,
		paddingHorizontal: Spacing.lg,
	},
	summaryCard: {
		width: "100%",
		borderWidth: 1,
		borderRadius: BorderRadius.card,
		padding: Spacing.lg,
		marginBottom: Spacing.xl,
	},
	routeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.md,
	},
	routeInfo: {
		flex: 1,
	},
	routeLabel: {
		fontSize: 12,
		fontWeight: "500",
		opacity: 0.6,
		marginBottom: 2,
	},
	routeName: {
		fontSize: 15,
		fontWeight: "500",
	},
	routeDivider: {
		height: 1,
		marginVertical: Spacing.md,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: Spacing.md,
		paddingTop: Spacing.md,
		borderTopWidth: 1,
	},
	stat: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.xs,
	},
	statText: {
		fontSize: 13,
	},
	price: {
		fontSize: 18,
		fontWeight: "700",
	},
	explanationContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: Spacing.md,
		paddingHorizontal: Spacing.md,
	},
	explanation: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
	},
	footer: {
		paddingHorizontal: Spacing.xl,
		paddingTop: Spacing.lg,
	},
	nextButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: Spacing.sm,
		paddingVertical: Spacing.lg,
		borderRadius: BorderRadius.button,
	},
	nextButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

