import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { trackEvent, AnalyticsEvents } from '../../../lib/posthog';
import { useAuth } from '../../../hooks/useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

const DISCOVERY_MESSAGES = [
  'Finding drivers near you...',
  'Checking driver availability...',
  'Looking for the best match...',
  'Reaching out to nearby drivers...',
  'Waiting for responses...',
];

const MESSAGE_ROTATION_INTERVAL = 3000; // 3 seconds

export const DiscoveryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, guestToken } = useAuth();

  const [rideSessionId, setRideSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [showExpandPrompt, setShowExpandPrompt] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const realtimeChannel = useRef<RealtimeChannel | null>(null);

  // Rotate discovery messages with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change message
        setCurrentMessageIndex(
          (prev) => (prev + 1) % DISCOVERY_MESSAGES.length
        );
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, MESSAGE_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  // Start discovery on mount
  useEffect(() => {
    startDiscovery();

    return () => {
      // Cleanup Realtime subscription
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, []);

  const startDiscovery = async () => {
    try {
      // Get ride session ID from params (passed from QRSessionScreen)
      const sessionId = params.rideSessionId as string;

      if (!sessionId) {
        Alert.alert('Error', 'Invalid ride session');
        router.back();
        return;
      }

      setRideSessionId(sessionId);

      // Call start-discovery Edge Function
      const headers: any = {};
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        headers.Authorization = `Bearer ${session?.access_token}`;
      } else if (guestToken) {
        headers['X-Guest-Token'] = guestToken;
      }

      const { data, error } = await supabase.functions.invoke(
        'start-discovery',
        {
          body: { ride_session_id: sessionId },
          headers,
        }
      );

      if (error) {
        throw error;
      }

      console.log('Discovery started:', data);
      trackEvent(AnalyticsEvents.DISCOVERY_STARTED, {
        ride_session_id: sessionId,
        notified_drivers: data.notified_driver_count,
      });

      setIsStarting(false);

      // Subscribe to ride offers
      subscribeToOffers(sessionId);

      // Set timeout for expand prompt (10 minutes)
      setTimeout(() => {
        checkForExpandPrompt(sessionId);
      }, 10 * 60 * 1000); // 10 minutes
    } catch (error) {
      console.error('Failed to start discovery:', error);
      Alert.alert(
        'Error',
        'Failed to start looking for drivers. Please try again.'
      );
      router.back();
    }
  };

  const subscribeToOffers = (sessionId: string) => {
    // Subscribe to Realtime changes on ride_offers table
    const channel = supabase
      .channel(`ride_offers:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers',
          filter: `ride_session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New offer received:', payload);
          handleOfferReceived(payload.new);
        }
      )
      .subscribe();

    realtimeChannel.current = channel;
  };

  const handleOfferReceived = (offer: any) => {
    setOffersCount((prev) => prev + 1);

    // Navigate to offers list screen
    // Note: We'll navigate immediately on first offer
    if (offersCount === 0) {
      trackEvent(AnalyticsEvents.OFFER_RECEIVED, {
        ride_session_id: rideSessionId,
        offer_type: offer.offer_type,
        offer_amount: offer.offer_amount,
      });

      // Navigate to offers list
      router.replace({
        pathname: '/ride/offers-list',
        params: {
          rideSessionId: rideSessionId,
        },
      });
    }
  };

  const checkForExpandPrompt = async (sessionId: string) => {
    try {
      // Check if any offers were received
      const { data: offers } = await supabase
        .from('ride_offers')
        .select('id')
        .eq('ride_session_id', sessionId);

      if (!offers || offers.length === 0) {
        setShowExpandPrompt(true);
      }
    } catch (error) {
      console.error('Failed to check offers:', error);
    }
  };

  const handleExpandSearch = async () => {
    try {
      // TODO: Call expand-discovery-wave Edge Function (Wave 2+)
      // For now, just dismiss the prompt
      setShowExpandPrompt(false);
      Alert.alert('Expanding search', 'Looking for drivers farther away...');

      trackEvent(AnalyticsEvents.DISCOVERY_EXPANDED, {
        ride_session_id: rideSessionId,
      });
    } catch (error) {
      console.error('Failed to expand search:', error);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update session status to canceled
              if (rideSessionId) {
                await supabase
                  .from('ride_sessions')
                  .update({ status: 'canceled', canceled_at: new Date().toISOString() })
                  .eq('id', rideSessionId);

                // Log cancellation event
                await supabase.from('ride_events').insert({
                  ride_session_id: rideSessionId,
                  event_type: 'canceled',
                  actor_type: user ? 'rider' : 'system',
                  actor_user_id: user?.id,
                  metadata: { reason: 'user_canceled_during_discovery' },
                });

                trackEvent(AnalyticsEvents.RIDE_CANCELED, {
                  ride_session_id: rideSessionId,
                  stage: 'discovery',
                });
              }

              router.replace('/');
            } catch (error) {
              console.error('Failed to cancel ride:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Looking for Drivers</Text>
        <Text style={styles.subtitle}>
          {params.originLabel} → {params.destinationLabel}
        </Text>
        <Text style={styles.fare}>Rora Fare: ${params.fareAmount}</Text>
      </View>

      {/* Animated Status Message */}
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Animated.View style={{ opacity: fadeAnim, marginTop: 20 }}>
          <Text style={styles.statusText}>
            {DISCOVERY_MESSAGES[currentMessageIndex]}
          </Text>
        </Animated.View>

        {offersCount > 0 && (
          <Text style={styles.offersCountText}>
            {offersCount} {offersCount === 1 ? 'driver has' : 'drivers have'}{' '}
            responded
          </Text>
        )}
      </View>

      {/* Expand Search Prompt */}
      {showExpandPrompt && (
        <View style={styles.expandPromptContainer}>
          <Text style={styles.expandPromptTitle}>
            We couldn't find a nearby driver yet
          </Text>
          <Text style={styles.expandPromptText}>
            Want us to look a bit farther out?
          </Text>
          <View style={styles.expandPromptButtons}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={handleExpandSearch}
            >
              <Text style={styles.expandButtonText}>Expand Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelPromptButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelPromptButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cancel Button */}
      {!showExpandPrompt && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Drivers will be notified of your ride request. You'll see their
          offers as they come in.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  fare: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  offersCountText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  expandPromptContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
  },
  expandPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  expandPromptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  expandPromptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  expandButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelPromptButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelPromptButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
