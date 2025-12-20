import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { space } from "../tokens/spacing";

/**
 * Card - Groups related info
 * One primary action. No nested cards.
 */
export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
  },
});
