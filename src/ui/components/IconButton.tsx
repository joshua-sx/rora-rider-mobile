import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Pressable } from "../primitives/Pressable";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";

type Variant = "ghost" | "soft" | "outline";

type Props = {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  children: React.ReactNode; // icon
  variant?: Variant;
  size?: number; // square
  style?: ViewStyle;
};

/**
 * IconButton - Circular button for icons
 * Use for navigation, actions, or toggles. Always provide accessibilityLabel.
 */
export function IconButton({
  onPress,
  disabled,
  accessibilityLabel,
  children,
  variant = "soft",
  size = 44,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={disabled ? undefined : onPress}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius.pill },
        variantStyles[variant],
        disabled && { opacity: 0.55 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  ghost: { backgroundColor: "transparent" },
  soft: { backgroundColor: colors.surface },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
};
