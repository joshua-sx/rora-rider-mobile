import { Divider } from "@/src/ui/components/Divider";
import { ListItem } from "@/src/ui/components/ListItem";
import { Box } from "@/src/ui/primitives/Box";
import { Text } from "@/src/ui/primitives/Text";
import { colors } from "@/src/ui/tokens/colors";
import { space } from "@/src/ui/tokens/spacing";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { getTabBarHeight } from "@/src/utils/safe-area";

export default function ProfileScreen() {
	const insets = useSafeAreaInsets();
	const tabBarHeight = getTabBarHeight(insets);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<Box style={styles.header}>
				<Text variant="title" style={styles.headerTitle}>
					Profile
				</Text>
			</Box>

			<ScrollView style={styles.scrollView}>
				{/* User Info Section */}
				<Box style={styles.userSection}>
					<Box style={styles.avatar}>
						<Ionicons name="person" size={48} color={colors.primary} />
					</Box>
					<Text variant="h2" style={styles.userName}>
						Joshua Bowers
					</Text>
					<Text variant="body" muted>
						joshua@example.com
					</Text>
				</Box>

				{/* Account Section */}
				<Box style={styles.section}>
					<Text variant="body" style={styles.sectionTitle}>
						Account
					</Text>

					<ListItem
						title="Personal Information"
						subtitle="Name, email, phone number"
						onPress={() => router.push("/personal-info")}
						leading={
							<Ionicons name="person-outline" size={24} color={colors.textMuted} />
						}
					/>
					<Divider />

					<ListItem
						title="Settings"
						subtitle="Notifications, privacy, preferences"
						onPress={() => router.push("/settings")}
						leading={
							<Ionicons
								name="settings-outline"
								size={24}
								color={colors.textMuted}
							/>
						}
					/>
				</Box>

				{/* Activity Section */}
				<Box style={styles.section}>
					<Text variant="body" style={styles.sectionTitle}>
						Activity
					</Text>

					<ListItem
						title="Ride History"
						subtitle="View all your rides"
						onPress={() => router.push("/trip-history")}
						leading={
							<Ionicons name="time-outline" size={24} color={colors.textMuted} />
						}
					/>
					<Divider />

					<ListItem
						title="Saved Locations"
						subtitle="Home, work, and favorite places"
						onPress={() => router.push("/saved-locations")}
						leading={
							<Ionicons
								name="bookmark-outline"
								size={24}
								color={colors.textMuted}
							/>
						}
					/>
					<Divider />

					<ListItem
						title="Favorite Drivers"
						subtitle="Your preferred drivers"
						onPress={() => router.push("/favorite-drivers")}
						leading={
							<Ionicons name="star-outline" size={24} color={colors.textMuted} />
						}
					/>
				</Box>

				{/* Payment Section */}
				<Box style={styles.section}>
					<Text variant="body" style={styles.sectionTitle}>
						Payment
					</Text>

					<ListItem
						title="Payment Methods"
						subtitle="Manage cards and payment options"
						onPress={() => router.push("/payment-methods")}
						leading={
							<Ionicons name="card-outline" size={24} color={colors.textMuted} />
						}
					/>
				</Box>

				{/* Support Section */}
				<Box style={styles.section}>
					<Text variant="body" style={styles.sectionTitle}>
						Support
					</Text>

					<ListItem
						title="Help Center"
						subtitle="FAQs and support"
						onPress={() => router.push("/help-center")}
						leading={
							<Ionicons
								name="help-circle-outline"
								size={24}
								color={colors.textMuted}
							/>
						}
					/>
					<Divider />

					<ListItem
						title="Contact Us"
						subtitle="Get in touch with support"
						onPress={() => router.push("/contact-us")}
						leading={
							<Ionicons name="mail-outline" size={24} color={colors.textMuted} />
						}
					/>
				</Box>

				<View style={{ height: tabBarHeight + space[4] }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
	},
	header: {
		paddingHorizontal: space[4],
		paddingVertical: space[4],
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	headerTitle: {
		fontWeight: "700",
	},
	scrollView: {
		flex: 1,
	},
	userSection: {
		alignItems: "center",
		paddingVertical: space[6],
		paddingHorizontal: space[4],
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	avatar: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: space[3],
	},
	userName: {
		fontWeight: "600",
		marginBottom: space[1],
	},
	section: {
		marginTop: space[4],
	},
	sectionTitle: {
		paddingHorizontal: space[4],
		paddingBottom: space[2],
		fontWeight: "600",
		color: colors.textMuted,
	},
});
