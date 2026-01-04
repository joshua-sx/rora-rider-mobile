import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { trackEvent, AnalyticsEvents } from '../../../lib/posthog';
import { formatFare } from '../../../services/pricing.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Offers List Screen
 *
 * Phase E implementation placeholder
 *
 * Displays driver offers for a ride session with:
 * - Top 3 offers prominently
 * - Price context labels (good_deal, normal, pricier)
 * - Real-time updates via Supabase Realtime
 * - Driver info, badges, and distance
 *
 * Spec refs: SPEC §25 Screen 5, FR-24, FR-25, FR-26
 */
export const OffersListScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rideSession, setRideSession] = useState<any>(null);
  const [expandedView, setExpandedView] = useState(false);

  const realtimeChannel = React.useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadOffersAndSession();

    return () => {
      // Cleanup Realtime subscription
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, []);

  const loadOffersAndSession = async () => {
    try {
      const rideSessionId = params.rideSessionId as string;

      if (!rideSessionId) {
        Alert.alert('Error', 'Invalid ride session');
        router.back();
        return;
      }

      // Load ride session
      const { data: session } = await supabase
        .from('ride_sessions')
        .select('*')
        .eq('id', rideSessionId)
        .single();

      setRideSession(session);

      // Load offers
      const { data: offersData } = await supabase
        .from('ride_offers')
        .select(`
          *,
          driver_profile:driver_user_id (
            user_id,
            driver_name,
            is_rora_pro,
            verification_status,
            current_lat,
            current_lng
          )
        `)
        .eq('ride_session_id', rideSessionId)
        .order('offer_amount', { ascending: true }); // Sort by price

      setOffers(offersData || []);

      // Subscribe to new offers
      subscribeToNewOffers(rideSessionId);
    } catch (error) {
      console.error('Failed to load offers:', error);
      Alert.alert('Error', 'Failed to load offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToNewOffers = (rideSessionId: string) => {
    const channel = supabase
      .channel(`ride_offers:${rideSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers',
          filter: `ride_session_id=eq.${rideSessionId}`,
        },
        async (payload) => {
          console.log('New offer received:', payload);

          // Fetch full offer with driver profile
          const { data: newOffer } = await supabase
            .from('ride_offers')
            .select(`
              *,
              driver_profile:driver_user_id (
                user_id,
                driver_name,
                is_rora_pro,
                verification_status
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newOffer) {
            setOffers((prev) => [...prev, newOffer].sort((a, b) => a.offer_amount - b.offer_amount));
          }
        }
      )
      .subscribe();

    realtimeChannel.current = channel;
  };

  const getPriceLabel = (offerAmount: number, roraFare: number) => {
    const percentDiff = ((offerAmount - roraFare) / roraFare) * 100;

    if (percentDiff <= -20) {
      return { label: 'Good deal', color: '#34C759' };
    } else if (percentDiff >= 30) {
      return { label: 'Pricier than usual', color: '#FF9500' };
    }
    return null;
  };

  const handleSelectOffer = async (offer: any) => {
    try {
      // TODO: Call select-offer Edge Function (Phase E)
      Alert.alert(
        'Select Driver',
        `You're selecting ${offer.driver_profile?.driver_name || 'this driver'} for ${formatFare(offer.offer_amount)}. This feature will be implemented in Phase E.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              trackEvent(AnalyticsEvents.OFFER_SELECTED, {
                ride_session_id: params.rideSessionId,
                offer_id: offer.id,
                offer_amount: offer.offer_amount,
              });
              // Navigate to Hold/Confirmation screen (Phase E)
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to select offer:', error);
      Alert.alert('Error', 'Failed to select offer. Please try again.');
    }
  };

  const renderOfferCard = (offer: any, index: number) => {
    const isTopThree = index < 3;
    const priceLabel = getPriceLabel(offer.offer_amount, rideSession?.rora_fare_amount || 0);

    return (
      <View
        key={offer.id}
        style={[
          styles.offerCard,
          isTopThree && styles.offerCardTopThree,
        ]}
      >
        <View style={styles.offerHeader}>
          <Text style={styles.driverName}>
            {offer.driver_profile?.driver_name || 'Driver'}
          </Text>
          <View style={styles.badges}>
            {offer.driver_profile?.is_rora_pro && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Pro</Text>
              </View>
            )}
            {offer.driver_profile?.verification_status === 'RORA_VERIFIED' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.offerDetails}>
          <View>
            <Text style={styles.offerType}>
              {offer.offer_type === 'accept' ? 'Accepted Rora Fare' : 'Counter Offer'}
            </Text>
            <Text style={styles.offerAmount}>{formatFare(offer.offer_amount)}</Text>
            {priceLabel && (
              <Text style={[styles.priceLabel, { color: priceLabel.color }]}>
                {priceLabel.label}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => handleSelectOffer(offer)}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  const topOffers = offers.slice(0, 3);
  const moreOffers = offers.slice(3);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Offers</Text>

      {offers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No offers yet. Waiting for drivers to respond...
          </Text>
        </View>
      ) : (
        <>
          {/* Top 3 Offers */}
          <Text style={styles.sectionTitle}>Top Offers</Text>
          {topOffers.map((offer, index) => renderOfferCard(offer, index))}

          {/* More Offers (Expandable) */}
          {moreOffers.length > 0 && (
            <View style={styles.moreOffersSection}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setExpandedView(!expandedView)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedView ? 'Hide' : `+ ${moreOffers.length} more offers`}
                </Text>
              </TouchableOpacity>

              {expandedView && moreOffers.map((offer, index) => renderOfferCard(offer, index + 3))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  offerCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  offerCardTopThree: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF9500',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  verifiedBadge: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  offerAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  moreOffersSection: {
    marginTop: 20,
  },
  expandButton: {
    padding: 12,
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
