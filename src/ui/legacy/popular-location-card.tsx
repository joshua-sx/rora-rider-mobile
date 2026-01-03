import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BorderRadius, Colors, Spacing, Typography } from "@/src/constants/design-tokens";
import { useThemeColor } from "@/src/hooks/use-theme-color";
import { formatDistance, formatDuration } from "@/src/utils/pricing";

export type PopularLocation = {
	id: string;
	name: string;
	image: string;
	description?: string; // Short description
	distance?: number; // Distance in km
	estimatedDuration?: number; // Duration in minutes
};

type PopularLocationCardProps = {
	location: PopularLocation;
	width?: number; // Optional width for dynamic sizing
	onPress?: (location: PopularLocation) => void;
};

export function PopularLocationCard({
	location,
	width = 300,
	onPress,
}: PopularLocationCardProps) {
	const borderColor = useThemeColor(
		{ light: "#E3E6E3", dark: "#2F3237" },
		"border",
	);

	// Format distance and duration display
	const distanceTimeText = (() => {
		if (!location.distance && !location.estimatedDuration) return null;

		const parts = [];
		if (location.distance) {
			parts.push(formatDistance(location.distance));
		}
		if (location.estimatedDuration) {
			parts.push(formatDuration(location.estimatedDuration));
		}
		return parts.join(" · ");
	})();

	return (
		<Pressable
			style={({ pressed }) => [
				styles.container,
				{ width, height: width, borderColor }, // Square aspect ratio
				pressed && styles.pressed,
			]}
			onPress={() => onPress?.(location)}
		>
			{/* Full-bleed image */}
			{location.image ? (
				<Image
					source={{ uri: location.image }}
					style={styles.image}
					contentFit="cover"
					placeholder={{ blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6." }}
					transition={200}
				/>
			) : (
				<View style={styles.placeholderImage} />
			)}

			{/* Gradient overlay for text readability */}
			<LinearGradient
				colors={["transparent", "rgba(0,0,0,0.7)"]}
				style={styles.gradient}
			/>

			{/* Content overlay at bottom */}
			<View style={styles.contentOverlay}>
				<Text style={styles.name} numberOfLines={1}>
					{location.name}
				</Text>

				{location.description && (
					<Text style={styles.description} numberOfLines={1}>
						{location.description}
					</Text>
				)}

				{distanceTimeText && (
					<View style={styles.distanceTimeRow}>
						<Ionicons name="car-outline" size={14} color={Colors.primary} />
						<Text style={styles.distanceTimeText}>{distanceTimeText}</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		borderRadius: BorderRadius.input, // 12px
		borderWidth: 1,
		overflow: "hidden",
		position: "relative",
	},
	pressed: {
		opacity: 0.9,
		transform: [{ scale: 0.98 }],
	},
	image: {
		width: "100%",
		height: "100%",
		position: "absolute",
	},
	placeholderImage: {
		width: "100%",
		height: "100%",
		backgroundColor: "#E3E6E3",
		position: "absolute",
	},
	gradient: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "60%", // Cover bottom 60% with gradient
	},
	contentOverlay: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: Spacing.lg, // 16px
		gap: Spacing.xs, // 4px
	},
	name: {
		fontSize: Typography.sizes.body, // 16px
		fontWeight: Typography.weights.semiBold, // 600
		color: "#FFFFFF",
		textShadowColor: "rgba(0, 0, 0, 0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
	description: {
		fontSize: Typography.sizes.bodySmall, // 14px
		fontWeight: Typography.weights.regular, // 400
		color: "#FFFFFF",
		opacity: 0.9,
		textShadowColor: "rgba(0, 0, 0, 0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
	distanceTimeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.xs, // 4px
		marginTop: Spacing.xs, // 4px
	},
	distanceTimeText: {
		fontSize: Typography.sizes.bodySmall, // 14px
		fontWeight: Typography.weights.medium, // 500
		color: "#FFFFFF",
		textShadowColor: "rgba(0, 0, 0, 0.5)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 3,
	},
});
