import { type ViewStyle } from "react-native";

import { GridCard } from "@/src/ui/components/GridCard";
import { formatDistance, formatDuration } from "@/src/utils/pricing";

export type PopularLocation = {
	id: string;
	name: string;
	image: string;
	description?: string;
	distance?: number;
	estimatedDuration?: number;
};

type PopularLocationCardProps = {
	location: PopularLocation;
	width?: number;
	onPress?: (location: PopularLocation) => void;
};

export function PopularLocationCard({
	location,
	width,
	onPress,
}: PopularLocationCardProps) {
	// Format distance and duration display
	const distanceTimeText = (() => {
		if (!location.distance && !location.estimatedDuration) return undefined;

		const parts = [];
		if (location.distance) {
			parts.push(formatDistance(location.distance));
		}
		if (location.estimatedDuration) {
			parts.push(formatDuration(location.estimatedDuration));
		}
		return parts.join(" · ");
	})();

	const containerStyle: ViewStyle | undefined = width ? { width } : undefined;

	return (
		<GridCard
			title={location.name}
			subtitle={location.description}
			tertiaryText={distanceTimeText}
			imageUrl={location.image || undefined}
			placeholderIcon="location"
			onPress={onPress ? () => onPress(location) : undefined}
			style={containerStyle}
		/>
	);
}
