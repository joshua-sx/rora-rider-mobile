import type { RefObject } from "react";
import type { EdgePadding, MapView } from "react-native-maps";

type LatLng = { latitude: number; longitude: number };

type FitMapOptions = {
	edgePadding: EdgePadding;
	minDelta?: number;
	animationDurationMs?: number;
};

export function fitMapToRoute(
	mapRef: RefObject<MapView>,
	coords: LatLng[],
	{
		edgePadding,
		minDelta = 0.02,
		animationDurationMs = 500,
	}: FitMapOptions,
) {
	if (!mapRef.current || coords.length === 0) return;

	if (coords.length === 1) {
		const single = coords[0];
		mapRef.current.animateToRegion(
			{
				latitude: single.latitude,
				longitude: single.longitude,
				latitudeDelta: minDelta,
				longitudeDelta: minDelta,
			},
			animationDurationMs,
		);
		return;
	}

	let minLat = coords[0].latitude;
	let maxLat = coords[0].latitude;
	let minLng = coords[0].longitude;
	let maxLng = coords[0].longitude;

	for (const coord of coords) {
		minLat = Math.min(minLat, coord.latitude);
		maxLat = Math.max(maxLat, coord.latitude);
		minLng = Math.min(minLng, coord.longitude);
		maxLng = Math.max(maxLng, coord.longitude);
	}

	const latDelta = maxLat - minLat;
	const lngDelta = maxLng - minLng;

	if (latDelta < minDelta && lngDelta < minDelta) {
		mapRef.current.animateToRegion(
			{
				latitude: (minLat + maxLat) / 2,
				longitude: (minLng + maxLng) / 2,
				latitudeDelta: minDelta,
				longitudeDelta: minDelta,
			},
			animationDurationMs,
		);
		return;
	}

	mapRef.current.fitToCoordinates(coords, {
		edgePadding,
		animated: true,
	});
}
