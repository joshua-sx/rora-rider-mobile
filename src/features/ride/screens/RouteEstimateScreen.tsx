import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { googleMapsService } from '../../../services/google-maps.service';
import { calculateFare, formatFare } from '../../../services/pricing.service';
import { trackEvent, AnalyticsEvents } from '../../../lib/posthog';
import { Skeleton } from '@/src/ui/components/Skeleton';
import { useToast } from '@/src/ui/providers/ToastProvider';

interface Location {
  lat: number;
  lng: number;
  label: string;
}

export const RouteEstimateScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();

  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [pricingMetadata, setPricingMetadata] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Pre-fill destination from params if available
  useEffect(() => {
    if (params.destinationLat && params.destinationLng && params.destinationLabel) {
      setDestination({
        lat: Number(params.destinationLat),
        lng: Number(params.destinationLng),
        label: params.destinationLabel as string,
      });
    }
  }, [params]);

  // Calculate fare when both origin and destination are set
  useEffect(() => {
    if (origin && destination && !fare) {
      handleCalculateFare();
    }
  }, [origin, destination]);

  const handleCalculateFare = async () => {
    if (!origin || !destination) return;

    setIsCalculating(true);

    try {
      const result = await calculateFare({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
      });

      setFare(result.amount);
      setPricingMetadata(result.calculation_metadata);

      // Track analytics
      trackEvent(AnalyticsEvents.ESTIMATE_CREATED, {
        origin: origin.label,
        destination: destination.label,
        fare_amount: result.amount,
        method: result.calculation_metadata?.method,
      });
    } catch (error) {
      console.error('Failed to calculate fare:', error);
      showToast('Failed to calculate fare. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGenerateQR = () => {
    if (!origin || !destination || !fare) return;

    router.push({
      pathname: '/ride/qr-session',
      params: {
        originLat: origin.lat,
        originLng: origin.lng,
        originLabel: origin.label,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationLabel: destination.label,
        fareAmount: fare,
        pricingMetadata: JSON.stringify(pricingMetadata),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan Your Ride</Text>

      {/* Origin Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>From</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            // Open places search modal for origin
            // For now, using placeholder
          }}
        >
          <Text style={origin ? styles.inputText : styles.placeholderText}>
            {origin?.label || 'Choose pickup location'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Destination Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>To</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            // Open places search modal for destination
            // For now, using placeholder
          }}
        >
          <Text style={destination ? styles.inputText : styles.placeholderText}>
            {destination?.label || 'Choose destination'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fare Display */}
      {isCalculating ? (
        <View style={styles.fareContainer}>
          <Skeleton width={100} height={16} />
          <Skeleton width={150} height={48} style={{ marginTop: 8 }} />
          <Skeleton width={120} height={12} style={{ marginTop: 8 }} />
        </View>
      ) : fare ? (
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Rora Fare</Text>
          <Text style={styles.fareAmount}>{formatFare(fare)}</Text>
          {pricingMetadata?.method && (
            <Text style={styles.fareMethod}>
              {pricingMetadata.method === 'zone_fixed'
                ? 'Fixed zone fare'
                : 'Distance-based estimate'}
            </Text>
          )}
        </View>
      ) : null}

      {/* Disclaimer */}
      {showDisclaimer && fare && (
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Final fare may be negotiated with the driver
          </Text>
          <TouchableOpacity onPress={() => setShowDisclaimer(false)}>
            <Text style={styles.dismissButton}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Generate QR Button */}
      {fare && (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateQR}
        >
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  fareContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  fareAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  fareMethod: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  calculatingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  disclaimerContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  dismissButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
