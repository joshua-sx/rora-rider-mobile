import React from "react";
import { Text as RNText, TextProps } from "react-native";
import { colors } from "../tokens/colors";
import { type } from "../tokens/typography";

type Variant = keyof typeof type;

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

/**
 * Text - Typography primitive
 * Primary variants: display, title, headline, body, caption, small, footnote, overline
 * Price variants: priceDisplay, priceCard, priceList
 */
export function Text({ variant = "body", muted, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        { color: muted ? colors.textMuted : colors.text },
        type[variant],
        style,
      ]}
    />
  );
}
