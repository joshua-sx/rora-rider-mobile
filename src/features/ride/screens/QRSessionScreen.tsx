import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useGuestToken } from '../../../hooks/useGuestToken';
import { generateQRTokenForRide } from '../../../services/qr-token.service';
import { trackEvent, AnalyticsEvents } from '../../../lib/posthog';
import { formatFare } from '../../../services/pricing.service';

export const QRSessionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { guestToken } = useGuestToken();

  const [rideSession, setRideSession] = useState<any>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);

  useEffect(() => {
    createRideSession();
  }, []);

  const createRideSession = async () => {
    try {
      const pricingMetadata = params.pricingMetadata
        ? JSON.parse(params.pricingMetadata as string)
        : null;

      const headers: any = {};
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      } else if (guestToken) {
        headers['X-Guest-Token'] = guestToken;
      }

      const { data, error } = await supabase.functions.invoke(
        'create-ride-session',
        {
          body: {
            origin: {
              lat: Number(params.originLat),
              lng: Number(params.originLng),
              label: params.originLabel,
            },
            destination: {
              lat: Number(params.destinationLat),
              lng: Number(params.destinationLng),
              label: params.destinationLabel,
            },
            rora_fare_amount: Number(params.fareAmount),
            pricing_calculation_metadata: pricingMetadata,
            request_type: 'broadcast',
          },
          headers,
        }
      );

      if (error) {
        console.error('Failed to create ride session:', error);
        throw error;
      }

      if (data?.success && data?.ride_session) {
        setRideSession(data.ride_session);

        // Generate QR token
        const token = generateQRTokenForRide(
          data.ride_session.id,
          params.originLabel as string,
          params.destinationLabel as string,
          Number(params.fareAmount)
        );

        setQrToken(token);

        // Track QR generation
        trackEvent(AnalyticsEvents.QR_GENERATED, {
          ride_session_id: data.ride_session.id,
          origin: params.originLabel,
          destination: params.destinationLabel,
          fare: params.fareAmount,
        });
      }
    } catch (error) {
      console.error('Ride session creation failed:', error);
      Alert.alert(
        'Error',
        'Failed to create ride session. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartDiscovery = () => {
    if (!rideSession) return;

    // Navigate to discovery screen
    router.push({
      pathname: '/ride/discovery',
      params: {
        rideSessionId: rideSession.id,
        originLabel: params.originLabel,
        destinationLabel: params.destinationLabel,
        fareAmount: params.fareAmount,
      },
    });
  };

  if (isCreating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Creating your ride session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Ride QR Code</Text>

      {/* Route Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>From:</Text>
          <Text style={styles.summaryValue}>{params.originLabel}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>To:</Text>
          <Text style={styles.summaryValue}>{params.destinationLabel}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Rora Fare:</Text>
          <Text style={styles.fareValue}>
            {formatFare(Number(params.fareAmount))}
          </Text>
        </View>
      </View>

      {/* QR Code */}
      {qrToken && (
        <View style={styles.qrContainer}>
          <QRCode
            value={qrToken}
            size={200}
            backgroundColor="#fff"
            color="#000"
          />
          <Text style={styles.qrHint}>Show this code to your driver</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How it works:</Text>
        <Text style={styles.instructionText}>
          1. Tap "Look for drivers" to notify nearby drivers
        </Text>
        <Text style={styles.instructionText}>
          2. Wait for driver offers to come in
        </Text>
        <Text style={styles.instructionText}>
          3. Or show this QR code to any driver
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartDiscovery}
      >
        <Text style={styles.startButtonText}>Look for Drivers</Text>
      </TouchableOpacity>
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
  summaryContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
  },
  qrHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
  instructionsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
