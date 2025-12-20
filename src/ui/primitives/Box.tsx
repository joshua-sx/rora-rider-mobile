import React from "react";
import { View, ViewProps } from "react-native";

/**
 * Box - The boring building block
 * Use View directly via this primitive.
 */
export function Box(props: ViewProps) {
  return <View {...props} />;
}
