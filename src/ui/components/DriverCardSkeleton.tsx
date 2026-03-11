import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';
import { colors } from '../tokens/colors';
import { space } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type Props = {
  style?: ViewStyle;
};

/**
 * DriverCardSkeleton - Loading placeholder for DriverCard
 * Matches the layout of the actual DriverCard component
 */
export function DriverCardSkeleton({ style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* Avatar placeholder */}
      <Skeleton width={48} height={48} borderRadius={24} style={styles.avatar} />
      
      {/* Name placeholder */}
      <Skeleton width="60%" height={16} style={styles.name} />
      
      {/* Rating placeholder */}
      <View style={styles.ratingRow}>
        <Skeleton width={60} height={12} />
      </View>
      
      {/* Vehicle info placeholder */}
      <Skeleton width="80%" height={12} style={styles.vehicleInfo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[3],
    alignItems: 'center',
  },
  avatar: {
    marginBottom: space[2],
  },
  name: {
    marginBottom: space[2],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[2],
  },
  vehicleInfo: {
    marginTop: space[1],
  },
});
