import React, { useMemo, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { space } from "../tokens/spacing";
import { Text } from "../primitives/Text";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/**
 * Input - Proper states
 * Default, Focused, Filled, Error, Disabled
 */
export function Input({
  label,
  error,
  editable = true,
  left,
  right,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = useMemo(() => {
    if (!editable) return colors.border;
    if (error) return colors.danger;
    if (focused) return colors.primary;
    return colors.border;
  }, [editable, error, focused]);

  return (
    <View style={{ gap: space[2] }}>
      {label ? <Text variant="cap" muted>{label}</Text> : null}

      <View style={[styles.wrap, { borderColor, opacity: editable ? 1 : 0.6 }]}>
        {left ? <View style={{ marginRight: space[3] }}>{left}</View> : null}

        <TextInput
          {...rest}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[styles.input, style]}
        />

        {right ? <View style={{ marginLeft: space[3] }}>{right}</View> : null}
      </View>

      {error ? <Text variant="cap" style={{ color: colors.danger }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space[4],
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
});
