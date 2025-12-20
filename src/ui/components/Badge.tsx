import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { space } from "../tokens/spacing";
import { Text } from "../primitives/Text";

type Props = ViewProps & {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
};

export function Badge({ label, tone = "neutral", style, ...rest }: Props) {
  return (
    <View {...rest} style={[styles.base, toneStyles[tone], style]}>
      <Text variant="cap" style={{ fontWeight: "600", color: toneText[tone] }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: space[3],
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
});

const toneStyles = {
  neutral: { backgroundColor: colors.bg, borderColor: colors.border },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  success: { backgroundColor: colors.success, borderColor: colors.success },
  warning: { backgroundColor: colors.warning, borderColor: colors.warning },
  danger:  { backgroundColor: colors.danger,  borderColor: colors.danger },
} as const;

const toneText = {
  neutral: colors.text,
  primary: colors.primaryText,
  success: "#FFFFFF",
  warning: "#FFFFFF",
  danger: "#FFFFFF",
} as const;
