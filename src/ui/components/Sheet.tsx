import React, { forwardRef, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { space } from "../tokens/spacing";

type Props = {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  enablePanDownToClose?: boolean;
  onChange?: (index: number) => void;
  animatedIndex?: SharedValue<number>;
  backgroundStyle?: StyleProp<ViewStyle>;
  handleIndicatorStyle?: StyleProp<ViewStyle>;
  animateOnMount?: boolean;
  enableOverDrag?: boolean;
  overDragResistanceFactor?: number;
  enableDynamicSizing?: boolean;
  activeOffsetY?: [number, number];
  failOffsetX?: [number, number];
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Bottom inset to account for tab bar or other overlays.
   * Sheet is the single owner of bottom padding - pass the real tab bar height here.
   * If not provided, falls back to safe area bottom inset.
   */
  bottomInset?: number;
};

/**
 * Sheet - Bottom sheet wrapper
 * Bottom sheets > modals for mobile. Period.
 */
export const Sheet = forwardRef<BottomSheet, Props>(
  (
    {
      children,
      snapPoints = ["20%", "55%"],
      index = 1,
      enablePanDownToClose = false,
      onChange,
      animatedIndex,
      backgroundStyle,
      handleIndicatorStyle,
      animateOnMount = false,
      enableOverDrag = false,
      overDragResistanceFactor = 0,
      enableDynamicSizing = false,
      activeOffsetY,
      failOffsetX,
      contentContainerStyle,
      bottomInset,
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets();
    const snaps = useMemo(() => snapPoints, [snapPoints]);

    // Sheet owns all bottom padding. Use explicit bottomInset if provided,
    // otherwise fall back to safe area bottom.
    const effectiveBottomInset = bottomInset ?? insets.bottom;

    const defaultBackgroundStyle = {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    };

    const defaultHandleStyle = {
      backgroundColor: colors.border,
      width: 40,
      height: 4,
      borderRadius: 2,
      marginTop: space[2], // 8px
    };

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={snaps}
        backgroundStyle={[defaultBackgroundStyle, backgroundStyle]}
        handleIndicatorStyle={[defaultHandleStyle, handleIndicatorStyle]}
        enablePanDownToClose={enablePanDownToClose}
        onChange={onChange}
        animatedIndex={animatedIndex}
        animateOnMount={animateOnMount}
        enableOverDrag={enableOverDrag}
        overDragResistanceFactor={overDragResistanceFactor}
        enableDynamicSizing={enableDynamicSizing}
        activeOffsetY={activeOffsetY}
        failOffsetX={failOffsetX}
      >
        <BottomSheetView
          style={[
            { flex: 1, paddingBottom: effectiveBottomInset },
            contentContainerStyle,
          ]}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

Sheet.displayName = "Sheet";
