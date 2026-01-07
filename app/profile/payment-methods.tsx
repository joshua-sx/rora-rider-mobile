import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/ui/components/Button';
import { Card } from '@/src/ui/components/Card';
import { Divider } from '@/src/ui/components/Divider';
import { EmptyState } from '@/src/ui/components/EmptyState';
import { IconButton } from '@/src/ui/components/IconButton';
import { Box } from '@/src/ui/primitives/Box';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Text } from '@/src/ui/primitives/Text';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';

type PaymentMethod = {
  id: string;
  type: 'card' | 'cash';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
};

// Mock data - would come from a payments store
const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'cash',
    isDefault: true,
  },
];

export default function PaymentMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleRemoveMethod = (method: PaymentMethod) => {
    if (method.type === 'cash') {
      Alert.alert('Cannot Remove', 'Cash payment option cannot be removed.');
      return;
    }

    Alert.alert('Remove Payment Method', `Remove card ending in ${method.last4}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPaymentMethods(paymentMethods.filter((m) => m.id !== method.id));
        },
      },
    ]);
  };

  const handleAddCard = () => {
    Alert.alert('Add Card', 'Card payment integration coming soon. Sint Maarten operates primarily on cash.');
  };

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Box style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </IconButton>
        <Text variant="h2" style={styles.headerTitle}>
          Payment Methods
        </Text>
        <IconButton accessibilityLabel="Add payment method" onPress={handleAddCard}>
          <Ionicons name="add" size={24} color={colors.text} />
        </IconButton>
      </Box>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <Card style={styles.infoBanner}>
          <Box style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Box style={{ flex: 1 }}>
              <Text variant="body" style={styles.infoTitle}>
                Cash is King in Sint Maarten
              </Text>
              <Text variant="sub" muted>
                Most taxi rides are paid in cash. Card payments may be added in the future.
              </Text>
            </Box>
          </Box>
        </Card>

        {/* Payment Methods List */}
        <Box style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            Your Payment Methods
          </Text>

          {paymentMethods.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="card-outline" size={48} color={colors.textMuted} />}
              message="No payment methods added. Cash is currently the default payment option."
            />
          ) : (
            paymentMethods.map((method, index) => (
              <React.Fragment key={method.id}>
                <Pressable onPress={() => handleSetDefault(method.id)}>
                  <Card style={styles.methodCard}>
                    <Box style={styles.methodHeader}>
                      <Box style={styles.methodIcon}>
                        {method.type === 'cash' ? (
                          <Ionicons name="cash" size={28} color={colors.success} />
                        ) : (
                          <Ionicons name={getCardIcon(method.brand)} size={28} color={colors.primary} />
                        )}
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text variant="body" style={styles.methodName}>
                          {method.type === 'cash' ? 'Cash' : `${method.brand} ****${method.last4}`}
                        </Text>
                        {method.type === 'card' && (
                          <Text variant="sub" muted>
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </Text>
                        )}
                        {method.type === 'cash' && (
                          <Text variant="sub" muted>
                            Pay driver directly
                          </Text>
                        )}
                      </Box>
                      {method.isDefault && (
                        <Box style={styles.defaultBadge}>
                          <Text variant="sub" style={styles.defaultText}>
                            Default
                          </Text>
                        </Box>
                      )}
                    </Box>

                    {!method.isDefault && (
                      <>
                        <Divider style={{ marginVertical: space[3] }} />
                        <Box style={styles.methodActions}>
                          <Pressable
                            style={styles.actionButton}
                            onPress={() => handleSetDefault(method.id)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                            <Text variant="sub" style={{ color: colors.primary }}>
                              Set as Default
                            </Text>
                          </Pressable>

                          {method.type !== 'cash' && (
                            <Pressable
                              style={styles.actionButton}
                              onPress={() => handleRemoveMethod(method)}
                            >
                              <Ionicons name="trash-outline" size={18} color={colors.danger} />
                              <Text variant="sub" style={{ color: colors.danger }}>
                                Remove
                              </Text>
                            </Pressable>
                          )}
                        </Box>
                      </>
                    )}
                  </Card>
                </Pressable>
                {index < paymentMethods.length - 1 && <View style={{ height: space[3] }} />}
              </React.Fragment>
            ))
          )}
        </Box>

        {/* Add Card Button */}
        <Box style={styles.addCardSection}>
          <Button variant="secondary" onPress={handleAddCard} style={styles.addCardButton}>
            <Box style={styles.addCardContent}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text variant="body" style={{ color: colors.primary }}>
                Add Credit or Debit Card
              </Text>
            </Box>
          </Button>
        </Box>

        {/* Payment Tips */}
        <Card style={styles.tipsCard}>
          <Text variant="body" style={styles.tipsTitle}>
            Payment Tips
          </Text>
          <Box style={styles.tipsList}>
            <Box style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text variant="sub" muted style={{ flex: 1 }}>
                Have small bills ready for exact fare
              </Text>
            </Box>
            <Box style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text variant="sub" muted style={{ flex: 1 }}>
                USD and ANG are both accepted
              </Text>
            </Box>
            <Box style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text variant="sub" muted style={{ flex: 1 }}>
                Tipping is appreciated but not required
              </Text>
            </Box>
          </Box>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
    gap: space[4],
  },
  infoBanner: {
    backgroundColor: colors.surface,
    padding: space[4],
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  section: {
    gap: space[3],
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  methodCard: {
    padding: space[4],
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: 4,
  },
  defaultText: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 12,
  },
  methodActions: {
    flexDirection: 'row',
    gap: space[4],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  addCardSection: {
    marginTop: space[2],
  },
  addCardButton: {
    borderStyle: 'dashed',
  },
  addCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  tipsCard: {
    padding: space[4],
    backgroundColor: colors.surface,
  },
  tipsTitle: {
    fontWeight: '600',
    marginBottom: space[3],
  },
  tipsList: {
    gap: space[2],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
});
