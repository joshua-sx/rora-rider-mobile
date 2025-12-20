import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Button } from "./Button";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { space } from "../tokens/spacing";

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

/**
 * ErrorState - Explain what happened, what to do next
 * Never blame the user.
 */
export function ErrorState({ title, message, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text variant="title" style={{ color: colors.danger }}>
        {title}
      </Text>
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
  message: {
    textAlign: "center",
    maxWidth: 280,
  },
});
