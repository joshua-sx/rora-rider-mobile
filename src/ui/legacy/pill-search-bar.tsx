import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { Text } from "@/src/ui/primitives/Text";
import { Box } from "@/src/ui/primitives/Box";
import { colors } from "@/src/ui/tokens/colors";
import { space } from "@/src/ui/tokens/spacing";

type PillSearchBarProps = {
	onSearchPress: () => void;
};

export function PillSearchBar({ onSearchPress }: PillSearchBarProps) {
	return (
		<Pressable
			onPress={onSearchPress}
			style={({ pressed }) => [
				styles.container,
				pressed && styles.pressed,
			]}
		>
			{/* Green circular search icon */}
			<Box style={styles.iconCircle}>
				<Ionicons name="search" size={20} color="#FFFFFF" />
			</Box>

			{/* "Where to?" text */}
			<Text style={styles.searchText}>
				Where to?
			</Text>

			{/* "Later" pill button */}
			<Box style={styles.laterButton}>
				<Ionicons
					name="calendar-outline"
					size={18}
					color={colors.text}
					style={styles.calendarIcon}
				/>
				<Text style={styles.laterText}>
					Later
				</Text>
			</Box>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		height: 60,
		borderRadius: 9999, // Pill shape (fully rounded)
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: space[2], // 8px - tighter on left for icon
		paddingRight: space[2], // 8px - tighter on right for later button
		backgroundColor: colors.surface,
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
		marginRight: space[3], // 12px
		backgroundColor: colors.primary,
	},
	searchText: {
		flex: 1,
		fontSize: 18,
		fontWeight: '600',
		letterSpacing: -0.2,
		color: colors.text,
	},
	laterButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: space[4], // 16px - more generous
		paddingVertical: space[2], // 8px - reduced padding
		borderRadius: 9999, // Pill shape
		backgroundColor: colors.bg,
		// No shadows - flat, clean appearance
		shadowColor: "transparent",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
		elevation: 0,
	},
	calendarIcon: {
		marginRight: space[2], // 8px
	},
	laterText: {
		fontSize: 14,
		fontWeight: '600',
		letterSpacing: -0.1,
		color: colors.text,
	},
});
