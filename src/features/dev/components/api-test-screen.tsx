import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GOOGLE_MAPS_PROXY_TOKEN, GOOGLE_MAPS_PROXY_URL } from '@/src/constants/config';
import { Colors, Spacing, Typography } from '@/src/constants/design-tokens';
import { googleMapsService } from '@/src/services/google-maps.service';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Dev-only screen component that previously lived at `app/api-test.tsx`.
 *
 * Note: Keeping `Stack.Screen` here is harmless, but if you ever render this
 * outside an Expo Router route, you may want to remove it.
 */
export default function APITestScreen() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Proxy Configuration', status: 'pending' },
    { name: 'Places Autocomplete', status: 'pending' },
    { name: 'Place Details', status: 'pending' },
    { name: 'Directions API', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>(
    'idle'
  );

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests((prev) => prev.map((test, i) => (i === index ? { ...test, ...update } : test)));
  };

  // Test 1: Proxy Configuration
  const testProxyConfig = async (index: number) => {
    updateTest(index, { status: 'running' });
    try {
      if (!GOOGLE_MAPS_PROXY_URL) throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL');
      if (!GOOGLE_MAPS_PROXY_TOKEN)
        throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN');

      updateTest(index, {
        status: 'passed',
        message: 'Proxy configured',
        details: {
          proxyUrl: GOOGLE_MAPS_PROXY_URL,
          proxyToken: `${GOOGLE_MAPS_PROXY_TOKEN.substring(0, 6)}...`,
        },
      });
    } catch (error: any) {
      updateTest(index, {
        status: 'failed',
        message: error.message,
      });
      throw error;
    }
  };

  // Test 2: Places Autocomplete (via proxy)
  const testPlacesAutocomplete = async (index: number) => {
    updateTest(index, { status: 'running' });
    try {
      const query = 'Princess Juliana Airport';
      const results = await googleMapsService.searchPlaces(query);
      if (!results.length) {
        throw new Error('No predictions returned');
      }

      updateTest(index, {
        status: 'passed',
        message: `Found ${results.length} suggestions`,
        details: {
          query,
          suggestions: results.slice(0, 3).map((p) => p.description),
          placeId: results[0].placeId,
        },
      });

      return results[0].placeId;
    } catch (error: any) {
      updateTest(index, {
        status: 'failed',
        message: error.message,
      });
      throw error;
    }
  };

  // Test 3: Place Details (via proxy)
  const testPlaceDetails = async (index: number, placeId: string) => {
    updateTest(index, { status: 'running' });
    try {
      const data = await googleMapsService.getPlaceDetails(placeId);
      const location = data?.result?.geometry?.location;
      if (!location) throw new Error('Missing location in place details');

      updateTest(index, {
        status: 'passed',
        message: 'Place details retrieved',
        details: {
          name: data?.result?.name,
          coordinates: `${location.lat}, ${location.lng}`,
          address: data?.result?.formatted_address,
        },
      });
    } catch (error: any) {
      updateTest(index, {
        status: 'failed',
        message: error.message,
      });
      throw error;
    }
  };

  // Test 4: Directions API (via proxy)
  const testDirections = async (index: number) => {
    updateTest(index, { status: 'running' });
    try {
      const origin = { latitude: 18.0419, longitude: -63.1086 }; // Airport
      const destination = { latitude: 18.0485, longitude: -63.1204 }; // Maho Beach
      const data = await googleMapsService.getDirections(origin, destination);

      if (data.status !== 'OK') {
        throw new Error(`API error: ${data.status}`);
      }

      const route = data.routes?.[0];
      const leg = route?.legs?.[0];
      const encoded = route?.overview_polyline?.points;
      if (!leg || !encoded) throw new Error('Missing route/leg/polyline');
      const coords = googleMapsService.decodePolyline(encoded);

      updateTest(index, {
        status: 'passed',
        message: 'Route calculated',
        details: {
          distance: leg.distance.text,
          duration: leg.duration.text,
          polylinePoints: coords.length,
        },
      });
    } catch (error: any) {
      updateTest(index, {
        status: 'failed',
        message: error.message,
      });
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');

    try {
      // Run tests sequentially
      await testProxyConfig(0);
      const placeId = await testPlacesAutocomplete(1);
      if (placeId) {
        await testPlaceDetails(2, placeId);
      }
      await testDirections(3);

      setOverallStatus('completed');
    } catch (error) {
      console.error('[api-test] Test run failed:', error);
      setOverallStatus('completed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="ellipse-outline" size={20} color="#8B8F95" />;
      case 'running':
        return <ActivityIndicator size="small" color={Colors.primary} />;
      case 'passed':
        return <Ionicons name="checkmark-circle" size={20} color="#00BE3C" />;
      case 'failed':
        return <Ionicons name="close-circle" size={20} color="#D14343" />;
    }
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'API Tests',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Google Maps Integration</Text>
            <Text style={styles.statusSubtitle}>Testing all required APIs for Sint Maarten</Text>

            {overallStatus === 'completed' && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{passedCount}</Text>
                  <Text style={styles.summaryLabel}>Passed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: '#D14343' }]}>
                    {failedCount}
                  </Text>
                  <Text style={styles.summaryLabel}>Failed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{tests.length}</Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
              </View>
            )}
          </View>

          {/* Test List */}
          <View style={styles.testList}>
            {tests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <View style={styles.testHeader}>
                  <View style={styles.testIcon}>{getStatusIcon(test.status)}</View>
                  <View style={styles.testInfo}>
                    <Text style={styles.testName}>{test.name}</Text>
                    {test.message && <Text style={styles.testMessage}>{test.message}</Text>}
                  </View>
                </View>

                {test.details && (
                  <View style={styles.testDetails}>
                    {Object.entries(test.details).map(([key, value]) => (
                      <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailKey}>{key}:</Text>
                        <Text style={styles.detailValue}>
                          {Array.isArray(value) ? value.join('\n') : String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              This test verifies that all Google Maps APIs are properly configured and working.
              Make sure you have enabled the required APIs in Google Cloud Console.
            </Text>
          </View>
        </ScrollView>

        {/* Run Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={runAllTests}
            disabled={isRunning}
            style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.runButtonText}>
                {overallStatus === 'idle' ? 'Run Tests' : 'Run Again'}
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    fontSize: Typography.sizes.h5,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statusSubtitle: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
  },
  testList: {
    gap: Spacing.md,
  },
  testItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  testIcon: {
    paddingTop: 2,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  testMessage: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.textSecondary,
  },
  testDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  detailKey: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text,
  },
  infoCard: {
    backgroundColor: '#E6F4FE',
    padding: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  runButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semiBold,
  },
});

