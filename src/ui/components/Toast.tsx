import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { space } from "../tokens/spacing";
import { shadow } from "../tokens/shadow";

type Props = {
  message: string;
  duration?: number;
  onDismiss?: () => void;
};

/**
 * Toast - Temporary feedback
 * One line when possible. Auto dismiss.
 */
export function Toast({ message, duration = 3000, onDismiss }: Props) {
  const translateY = useSharedValue(-100);

  useEffect(() => {
    translateY.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(0, { duration }),
      withTiming(-100, { duration: 200 }, () => {
        if (onDismiss) {
          runOnJS(onDismiss)();
        }
      })
    );
  }, [translateY, duration, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.toast}>
        <Text variant="sub" style={{ color: colors.bg }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: space[4],
    right: space[4],
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    ...shadow.md,
  },
});
