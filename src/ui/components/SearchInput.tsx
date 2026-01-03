import React from "react";
import { TextInputProps } from "react-native";
import { Input } from "./Input";

type Props = TextInputProps & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function SearchInput({ leftIcon, rightIcon, ...props }: Props) {
  return (
    <Input
      {...props}
      left={leftIcon}
      right={rightIcon}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
    />
  );
}
