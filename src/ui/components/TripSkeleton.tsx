import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';

export function TripSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.badge, { opacity }]} />
        <Animated.View style={[styles.date, { opacity }]} />
      </View>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <Animated.View style={[styles.icon, { opacity }]} />
          <Animated.View style={[styles.routeText, { opacity }]} />
        </View>
        <View style={styles.routeDivider}>
          <Animated.View style={[styles.dividerLine, { opacity }]} />
        </View>
        <View style={styles.routeRow}>
          <Animated.View style={[styles.icon, { opacity }]} />
          <Animated.View style={[styles.routeText, { opacity }]} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <Animated.View style={[styles.stat, { opacity }]} />
          <Animated.View style={[styles.stat, { opacity }]} />
        </View>
        <Animated.View style={[styles.price, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: space[4],
    marginBottom: space[4],
    gap: space[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    width: 80,
    height: 24,
    backgroundColor: colors.border,
    borderRadius: 12,
  },
  date: {
    width: 60,
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  route: {
    gap: space[2],
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  icon: {
    width: 20,
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 10,
  },
  routeText: {
    flex: 1,
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space[2],
  },
  dividerLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stats: {
    flexDirection: 'row',
    gap: space[4],
  },
  stat: {
    width: 60,
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  price: {
    width: 70,
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});
