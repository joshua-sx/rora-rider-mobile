import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../tokens/colors";

type Props = {
  style?: ViewStyle;
};

/**
 * Divider - Simple horizontal line
 */
export function Divider({ style }: Props) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
