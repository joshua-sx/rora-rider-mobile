import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { type MapViewProps } from 'react-native-maps';

type MapSheetTemplateProps = {
  /**
   * MapView component props
   */
  mapProps: MapViewProps;
  /**
   * Bottom sheet component (should be a Sheet or BottomSheet component)
   */
  sheet: ReactNode;
  /**
   * Optional overlay to dim the map when sheet expands
   */
  showMapDim?: boolean;
  /**
   * Opacity of map dim overlay (0-1)
   * @default 0.3
   */
  mapDimOpacity?: number;
};

/**
 * MapSheetTemplate - Reusable template for map + bottom sheet screens
 *
 * Features:
 * - Full-screen map with absolute positioning
 * - Bottom sheet overlay
 * - Optional map dimming when sheet expands
 * - GestureHandlerRootView wrapper for gesture support
 * - Automatic safe area handling
 *
 * @example
 * ```tsx
 * <MapSheetTemplate
 *   mapProps={{
 *     initialRegion: INITIAL_REGION,
 *     showsUserLocation: true,
 *   }}
 *   sheet={
 *     <DestinationBottomSheet bottomInset={tabBarHeight} />
 *   }
 * />
 * ```
 */
export function MapSheetTemplate({
  mapProps,
  sheet,
  showMapDim = false,
  mapDimOpacity = 0.3,
}: MapSheetTemplateProps) {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Map Layer */}
        <MapView
          style={styles.map}
          {...mapProps}
        />

        {/* Optional Map Dim Overlay */}
        {showMapDim && (
          <View
            style={[
              styles.mapDimOverlay,
              { backgroundColor: `rgba(0, 0, 0, ${mapDimOpacity})` },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Bottom Sheet Layer */}
        {sheet}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapDimOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
