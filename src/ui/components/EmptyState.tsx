import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Button } from "./Button";
import { Text } from "../primitives/Text";
import { space } from "../tokens/spacing";

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * EmptyState - Clear message + single action
 * No jokes. Be helpful.
 */
export function EmptyState({ message, actionLabel, onAction, icon, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text variant="body" muted style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: space[6],
    gap: space[4],
  },
  icon: {
    marginBottom: space[2],
  },
  message: {
    textAlign: "center",
    maxWidth: 280,
  },
});
