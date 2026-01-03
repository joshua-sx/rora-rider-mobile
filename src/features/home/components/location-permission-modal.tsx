/**
 * Location Permission Modal
 * Custom explanation screen before requesting system location permission
 */

import React from "react";
import {
	Modal,
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
	Colors,
	Typography,
	Spacing,
	BorderRadius,
	Shadows,
} from "@/src/constants/design-tokens";

interface LocationPermissionModalProps {
	visible: boolean;
	onAllowAccess: () => void;
	onEnterManually: () => void;
}

export function LocationPermissionModal({
	visible,
	onAllowAccess,
	onEnterManually,
}: LocationPermissionModalProps) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
		>
			<View style={styles.overlay}>
				<BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						{/* Icon Section */}
						<View style={styles.iconContainer}>
							<View style={styles.iconCircle}>
								<Ionicons name="navigate" size={48} color={Colors.primary} />
							</View>
						</View>

						{/* Text Content */}
						<View style={styles.textContainer}>
							<Text style={styles.title}>
								Allow &quot;Rora&quot; to use your location?
							</Text>
							<Text style={styles.description}>
								Tap &apos;Allow Location Access&apos; to help your driver find
								your exact location via GPS
							</Text>
						</View>

						{/* Map Preview Placeholder */}
						<View style={styles.mapPreview}>
							<View style={styles.mapPlaceholder}>
								<Ionicons name="location" size={32} color={Colors.primary} />
								<View style={styles.preciseLabel}>
									<Ionicons name="navigate" size={14} color={Colors.primary} />
									<Text style={styles.preciseLabelText}>Precise: On</Text>
								</View>
							</View>
						</View>

						{/* Action Buttons */}
						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={styles.primaryButton}
								onPress={onAllowAccess}
								activeOpacity={0.8}
							>
								<Text style={styles.primaryButtonText}>
									Allow Location Access
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={onEnterManually}
								activeOpacity={0.7}
							>
								<Text style={styles.secondaryButtonText}>Enter Manually</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContainer: {
		width: "85%",
		maxWidth: 400,
		borderRadius: BorderRadius.xl,
		overflow: "hidden",
		...Shadows.xl,
	},
	modalContent: {
		backgroundColor: Colors.surface,
		padding: Spacing.xxxl,
		alignItems: "center",
	},
	iconContainer: {
		marginBottom: Spacing.xl,
	},
	iconCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: `${Colors.primary}15`,
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		alignItems: "center",
		marginBottom: Spacing.xxl,
	},
	title: {
		fontSize: Typography.sizes.h4,
		fontWeight: Typography.weights.semiBold,
		color: Colors.text,
		textAlign: "center",
		marginBottom: Spacing.md,
	},
	description: {
		fontSize: Typography.sizes.bodySmall,
		fontWeight: Typography.weights.regular,
		color: Colors.textSecondary,
		textAlign: "center",
		lineHeight: Typography.sizes.bodySmall * Typography.lineHeights.normal,
	},
	mapPreview: {
		width: "100%",
		height: 120,
		borderRadius: BorderRadius.lg,
		overflow: "hidden",
		marginBottom: Spacing.xxl,
		backgroundColor: Colors.background,
	},
	mapPlaceholder: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	preciseLabel: {
		position: "absolute",
		top: Spacing.sm,
		left: Spacing.sm,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.surface,
		paddingHorizontal: Spacing.md,
		paddingVertical: Spacing.xs,
		borderRadius: BorderRadius.full,
		gap: Spacing.xs,
		...Shadows.sm,
	},
	preciseLabelText: {
		fontSize: Typography.sizes.caption,
		fontWeight: Typography.weights.medium,
		color: Colors.primary,
	},
	buttonContainer: {
		width: "100%",
		gap: Spacing.md,
	},
	primaryButton: {
		backgroundColor: Colors.primary,
		paddingVertical: Spacing.lg,
		paddingHorizontal: Spacing.xl,
		borderRadius: BorderRadius.button,
		alignItems: "center",
		...Shadows.sm,
	},
	primaryButtonText: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.semiBold,
		color: Colors.surface,
	},
	secondaryButton: {
		backgroundColor: Colors.background,
		paddingVertical: Spacing.lg,
		paddingHorizontal: Spacing.xl,
		borderRadius: BorderRadius.button,
		alignItems: "center",
		borderWidth: 1,
		borderColor: Colors.border,
	},
	secondaryButtonText: {
		fontSize: Typography.sizes.body,
		fontWeight: Typography.weights.medium,
		color: Colors.text,
	},
});
