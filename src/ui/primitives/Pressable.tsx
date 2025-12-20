import React from "react";
import { Pressable as RNPressable, PressableProps } from "react-native";

/**
 * Pressable - Interaction primitive
 * Standard press feedback: 85% opacity
 */
export function Pressable({ style, ...rest }: PressableProps) {
  return (
    <RNPressable
      {...rest}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        state.pressed ? { opacity: 0.85 } : null,
      ]}
    />
  );
}
