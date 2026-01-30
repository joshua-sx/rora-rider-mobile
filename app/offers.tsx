/**
 * @deprecated This screen is deprecated. Offers list is now handled by
 * RideSheetOffers component within the RideSheet on the home screen.
 * See: src/features/ride/components/sheets/RideSheetOffers.tsx
 *
 * This file will be removed in a future cleanup.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/src/ui/components/themed-text';
import { ThemedView } from '@/src/ui/components/themed-view';
import { OfferCard } from '@/src/ui/components/OfferCard';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { useToast } from '@/src/ui/providers/ToastProvider';
import { Spacing } from '@/src/constants/design-tokens';
import {
  fetchRideOffers,
  subscribeToRideOffers,
  type RideOffer,
} from '@/src/services/rides.service';

export default function OffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rideSessionId: string; roraFare: string }>();
  const { showToast } = useToast();

  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingOfferId, setSelectingOfferId] = useState<string | null>(null);

  const backgroundColor = useThemeColor(
    { light: '#F9F9F9', dark: '#0E0F0F' },
    'background'
  );
  const tintColor = useThemeColor({}, 'tint');
  const secondaryTextColor = useThemeColor(
    { light: '#5C5F62', dark: '#A0A5AA' },
    'textSecondary'
  );

  const rideSessionId = params.rideSessionId;
  const roraFare = params.roraFare ? parseFloat(params.roraFare) : 0;

  // Load initial offers
  useEffect(() => {
    if (!rideSessionId) {
      showToast('No ride session found');
      router.back();
      return;
    }

    const loadOffers = async () => {
      const result = await fetchRideOffers(rideSessionId);
      if (result.success) {
        setOffers(result.offers);
      }
      setLoading(false);
    };

    loadOffers();
  }, [rideSessionId, router, showToast]);

  // Subscribe to real-time offers
  useEffect(() => {
    if (!rideSessionId) return;

    const subscription = subscribeToRideOffers(rideSessionId, (newOffer) => {
      setOffers((prev) => {
        // Avoid duplicates
        if (prev.some((o) => o.id === newOffer.id)) return prev;

        // Add new offer and sort by price
        const updated = [...prev, newOffer].sort(
          (a, b) => (a.offered_amount || 0) - (b.offered_amount || 0)
        );

        // Haptic feedback for new offer
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        return updated;
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [rideSessionId]);

  const getPriceLabel = useCallback(
    (offerAmount: number): 'good-deal' | 'pricier' | null => {
      if (!roraFare) return null;
      const percentDiff = ((offerAmount - roraFare) / roraFare) * 100;
      if (percentDiff <= -20) return 'good-deal';
      if (percentDiff >= 30) return 'pricier';
      return null;
    },
    [roraFare]
  );

  const handleSelectOffer = useCallback(
    async (offer: RideOffer) => {
      setSelectingOfferId(offer.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // TODO: Call select-offer Edge Function
      // For now, simulate selection
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSelectingOfferId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      showToast(`Selected ${offer.driver_profile?.display_name || 'driver'}`);

      // Navigate to active ride screen (or back home for now)
      router.push('/');
    },
    [router, showToast]
  );

  const renderOffer = useCallback(
    ({ item }: { item: RideOffer }) => {
      const driverProfile = item.driver_profile;
      const vehicleInfo = driverProfile
        ? `${driverProfile.vehicle_make || ''} ${driverProfile.vehicle_model || ''} • ${driverProfile.vehicle_type || 'Sedan'}`
        : 'Vehicle info unavailable';

      return (
        <OfferCard
          driverName={driverProfile?.display_name || 'Driver'}
          driverPhoto={
            driverProfile?.avatar_url
              ? { uri: driverProfile.avatar_url }
              : undefined
          }
          isVerified={true} // All drivers in discovery are verified
          isPro={false} // Would need to check driver_profile.is_rora_pro
          price={item.offered_amount || roraFare}
          priceLabel={getPriceLabel(item.offered_amount || roraFare)}
          distanceText="Nearby" // Would calculate from driver location
          vehicleInfo={vehicleInfo.trim() || 'Sedan'}
          onSelect={() => handleSelectOffer(item)}
          isSelecting={selectingOfferId === item.id}
          style={styles.offerCard}
        />
      );
    },
    [getPriceLabel, handleSelectOffer, roraFare, selectingOfferId]
  );

  if (loading) {
    return (
      <ThemedView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading offers...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>Driver Offers</ThemedText>
        <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
          {offers.length > 0
            ? `${offers.length} driver${offers.length > 1 ? 's' : ''} responded`
            : 'Waiting for drivers...'}
        </ThemedText>
      </View>

      {offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={tintColor} />
          <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
            Drivers are reviewing your request...
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtext, { color: secondaryTextColor }]}
          >
            You'll see offers as they come in
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={renderOffer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  offerCard: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
