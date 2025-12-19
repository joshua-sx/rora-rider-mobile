import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/design-tokens";
import { useThemeColor } from "@/hooks/use-theme-color";

type PillSearchBarProps = {
	onSearchPress: () => void;
};

export function PillSearchBar({ onSearchPress }: PillSearchBarProps) {
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

	return (
		<Pressable
			onPress={onSearchPress}
			style={({ pressed }) => [
				styles.container,
				{ backgroundColor: surfaceColor },
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

			{/* "Later" button (non-functional placeholder) */}
			<View style={styles.laterButton}>
				<Ionicons
					name="calendar-outline"
					size={16}
					color={secondaryTextColor}
					style={styles.calendarIcon}
				/>
				<ThemedText style={[styles.laterText, { color: secondaryTextColor }]}>
					Later
				</ThemedText>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 56,
		borderRadius: 9999, // Pill shape (fully rounded)
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing.md, // 12px
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 3,
	},
	pressed: {
		opacity: 0.9,
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
		fontSize: Typography.sizes.body, // 16px
		fontWeight: Typography.weights.medium,
	},
	laterButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: Spacing.sm, // 8px
	},
	calendarIcon: {
		marginRight: Spacing.sm, // 8px
	},
	laterText: {
		fontSize: Typography.sizes.body, // 16px
		fontWeight: Typography.weights.medium,
	},
});
