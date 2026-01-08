import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Trip } from '@/src/types/trip';
import { formatPrice, formatDistance, formatDuration } from '@/src/utils/pricing';
import { Card } from './Card';
import { Badge } from './Badge';
import { Pressable } from '../primitives/Pressable';
import { Text } from '../primitives/Text';
import { Box } from '../primitives/Box';
import { colors } from '../tokens/colors';
import { space } from '../tokens/spacing';
import { radius } from '../tokens/radius';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
  showQuoteAge?: boolean;
  warnIfStale?: boolean;
}

/**
 * TripCard - Reusable trip card component
 * Used in trip history, trip selector, and trip detail screens
 */
export function TripCard({ trip, onPress, showQuoteAge, warnIfStale }: TripCardProps) {
  const getQuoteAge = (createdAt: string) => {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const ageInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (ageInDays === 0) return 'Today';
    if (ageInDays === 1) return '1 day ago';
    if (ageInDays < 7) return `${ageInDays} days ago`;
    return `${ageInDays} days ago`;
  };

  const isStale = (createdAt: string) => {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    const ageInDays = (now - created) / (1000 * 60 * 60 * 24);
    return ageInDays > 7;
  };

  const getStatusBadge = () => {
    const statusConfig: Record<
      typeof trip.status,
      { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'primary' }
    > = {
      not_taken: { label: 'Not Taken', tone: 'neutral' },
      pending: { label: 'Pending', tone: 'warning' },
      in_progress: { label: 'In Progress', tone: 'primary' },
      completed: { label: 'Completed', tone: 'success' },
      cancelled: { label: 'Cancelled', tone: 'danger' },
    };
    return statusConfig[trip.status];
  };

  const quoteAge = trip.quote.createdAt ? getQuoteAge(trip.quote.createdAt) : null;
  const quoteIsStale = trip.quote.createdAt ? isStale(trip.quote.createdAt) : false;
  const statusBadge = getStatusBadge();

  const CardWrapper = onPress ? Pressable : View;

  return (
    <CardWrapper onPress={onPress} style={styles.cardWrapper}>
      <Card style={styles.card}>
        {/* Header */}
        <Box style={styles.header}>
          <Box style={styles.headerLeft}>
            <Badge label={statusBadge.label} tone={statusBadge.tone} />
            {trip.saved && (
              <Ionicons name="bookmark" size={16} color={colors.primary} style={{ marginLeft: space[2] }} />
            )}
          </Box>
          {showQuoteAge && quoteAge && (
            <Text variant="sub" muted style={warnIfStale && quoteIsStale ? styles.staleText : undefined}>
              {quoteAge}
              {warnIfStale && quoteIsStale && ' ⚠️'}
            </Text>
          )}
        </Box>

        {/* Route */}
        <Box style={styles.route}>
          <Box style={styles.routeRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text variant="body" style={styles.routeText} numberOfLines={1}>
              {trip.origin.name}
            </Text>
          </Box>
          <Box style={styles.routeDivider}>
            <View style={styles.routeLine} />
            <Ionicons name="arrow-down" size={16} color={colors.textSecondary} />
          </Box>
          <Box style={styles.routeRow}>
            <Ionicons name="location" size={20} color={colors.danger} />
            <Text variant="body" style={styles.routeText} numberOfLines={1}>
              {trip.destination.name}
            </Text>
          </Box>
        </Box>

        {/* Stats */}
        <Box style={styles.footer}>
          <Box style={styles.stats}>
            <Box style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
              <Text variant="sub" muted>
                {formatDistance(trip.routeData.distance ?? 0)}
              </Text>
            </Box>
            <Box style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text variant="sub" muted>
                {formatDuration(trip.routeData.duration)}
              </Text>
            </Box>
          </Box>
          <Text variant="body" style={styles.price}>
            {formatPrice(trip.routeData.price)}
          </Text>
        </Box>

        {/* Driver Info (if assigned) */}
        {trip.driverId && (
          <Box style={styles.driverInfo}>
            <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
            <Text variant="sub" muted>
              Driver assigned
            </Text>
          </Box>
        )}

        {/* Stale Warning */}
        {warnIfStale && quoteIsStale && (
          <Box style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text variant="sub" style={styles.warningText}>
              Fare estimate may be outdated. Price may have changed.
            </Text>
          </Box>
        )}
      </Card>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: space[3],
  },
  card: {
    gap: space[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staleText: {
    color: colors.warning,
  },
  route: {
    gap: space[2],
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  routeText: {
    flex: 1,
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space[2],
    gap: space[2],
  },
  routeLine: {
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
    flex: 1,
    flexDirection: 'row',
    gap: space[3],
    minWidth: 0,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  price: {
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 0,
    marginLeft: space[3],
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingTop: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingTop: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[2],
    backgroundColor: `${colors.warning}15`,
    borderRadius: radius.sm,
  },
  warningText: {
    flex: 1,
    color: colors.warning,
    fontSize: 13,
  },
});
