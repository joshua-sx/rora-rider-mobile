import React from "react";
import { StyleSheet, View } from "react-native";
import { Pressable } from "../primitives/Pressable";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { space } from "../tokens/spacing";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

/**
 * ListItem - Entire row tappable
 * Structure: Leading | Content | Trailing
 */
export function ListItem({ title, subtitle, onPress, leading, trailing }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" style={{ fontWeight: "600" }}>{title}</Text>
        {subtitle ? <Text variant="sub" muted>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leading: { width: 40, alignItems: "center" },
  trailing: { alignItems: "flex-end" },
});
