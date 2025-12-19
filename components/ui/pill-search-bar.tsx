import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";

type PillSearchBarProps = {
	onSearchPress: () => void;
};

export function PillSearchBar({ onSearchPress }: PillSearchBarProps) {
	const containerColor = useThemeColor(
		{ light: "#F5F5F5", dark: "#1C1C1C" },
		"surface",
	);
	const textColor = useThemeColor(
		{ light: "#262626", dark: "#E5E7EA" },
		"text",
	);
	const laterButtonBg = useThemeColor(
		{ light: "#FFFFFF", dark: "#2A2A2A" },
		"surface",
	);
	const laterTextColor = useThemeColor(
		{ light: "#262626", dark: "#E5E7EA" },
		"text",
	);

	return (
		<Pressable
			onPress={onSearchPress}
			style={({ pressed }) => [
				styles.container,
				{ backgroundColor: containerColor },
				pressed && styles.pressed,
			]}
		>
			{/* Green circular search icon */}
			<View style={[styles.iconCircle, { backgroundColor: Colors.primary }]}>
				<Ionicons name="search" size={20} color="#FFFFFF" />
			</View>

			{/* "Where to?" text */}
			<ThemedText style={[styles.searchText, { color: textColor }]}>
				Where to?
			</ThemedText>

			{/* "Later" pill button */}
			<View style={[styles.laterButton, { backgroundColor: laterButtonBg }]}>
				<Ionicons
					name="calendar-outline"
					size={18}
					color={laterTextColor}
					style={styles.calendarIcon}
				/>
				<ThemedText style={[styles.laterText, { color: laterTextColor }]}>
					Later
				</ThemedText>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 60,
		borderRadius: 9999, // Pill shape (fully rounded)
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: Spacing.sm, // 8px - tighter on left for icon
		paddingRight: Spacing.sm, // 8px - tighter on right for later button
	},
	pressed: {
		opacity: 0.95,
		transform: [{ scale: 0.995 }],
	},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		marginRight: Spacing.md, // 12px
	},
	searchText: {
		flex: 1,
		fontSize: Typography.sizes.h5, // 18px - larger for prominence
		fontWeight: Typography.weights.semiBold, // 600 - bolder
		letterSpacing: -0.2,
	},
	laterButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing.lg, // 16px - more generous
		paddingVertical: Spacing.sm, // 8px - reduced padding
		borderRadius: 9999, // Pill shape
		// No shadows - flat, clean appearance
		shadowColor: "transparent",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
	calendarIcon: {
		marginRight: Spacing.sm, // 8px
	},
	laterText: {
		fontSize: Typography.sizes.bodySmall, // 14px
		fontWeight: Typography.weights.semiBold, // 600
		letterSpacing: -0.1,
	},
});
