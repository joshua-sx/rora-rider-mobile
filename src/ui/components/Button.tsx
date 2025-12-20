import React from "react";
import { ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { Pressable } from "../primitives/Pressable";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { space } from "../tokens/spacing";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
  style?: ViewStyle;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/**
 * Button - One per screen
 * If everything is primary, nothing is.
 */
export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  fullWidth = true,
  style,
  left,
  right,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        fullWidth && { alignSelf: "stretch" },
        variantStyles[variant],
        isDisabled && { opacity: 0.55 },
        style,
      ]}
    >
      {left ? <>{left}</> : null}

      {loading ? (
        <ActivityIndicator color={labelColors[variant]} />
      ) : (
        <Text
          variant="sub"
          style={{ color: labelColors[variant], fontWeight: "600" }}
        >
          {label}
        </Text>
      )}

      {right ? <>{right}</> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: space[5],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: space[2],
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tertiary: { backgroundColor: "transparent" },
  danger: { backgroundColor: colors.danger },
};

const labelColors: Record<Variant, string> = {
  primary: colors.primaryText,
  secondary: colors.text,
  tertiary: colors.primary,
  danger: "#FFFFFF",
};
