import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { colors } from "../tokens/colors";
import { Text } from "../primitives/Text";

type Props = {
  size?: number;
  uri?: string;
  name?: string; // for initials fallback
};

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "?";
}

export function Avatar({ size = 40, uri, name }: Props) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text variant="sub" style={{ fontWeight: "700" }}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
