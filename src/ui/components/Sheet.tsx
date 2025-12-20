import React, { forwardRef, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import type { SharedValue } from "react-native-reanimated";

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
    },
    ref
  ) => {
    const snaps = useMemo(() => snapPoints, [snapPoints]);

    const defaultBackgroundStyle = {
      backgroundColor: colors.bg,
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
        <BottomSheetView style={[{ flex: 1 }, contentContainerStyle]}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

Sheet.displayName = "Sheet";
