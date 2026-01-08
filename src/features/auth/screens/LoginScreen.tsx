import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Box } from '@/src/ui/primitives/Box';
import { Text } from '@/src/ui/primitives/Text';
import { Pressable } from '@/src/ui/primitives/Pressable';
import { Button } from '@/src/ui/components/Button';
import { colors } from '@/src/ui/tokens/colors';
import { space } from '@/src/ui/tokens/spacing';
import { radius } from '@/src/ui/tokens/radius';
import { type } from '@/src/ui/tokens/typography';
import { useToast } from '@/src/ui/providers/ToastProvider';

import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { trackEvent, AnalyticsEvents } from '@/src/lib/posthog';

type AuthMethod = 'phone' | 'email';

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setAuthenticatedUser } = useAuth();

  const handleSendOtp = async () => {
    setIsLoading(true);

    try {
      if (authMethod === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phoneNumber,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          },
        });
        if (error) throw error;
      }

      setIsOtpSent(true);
      trackEvent(AnalyticsEvents.APP_LAUNCHED);
    } catch (err) {
      console.error('Failed to send OTP:', err);
      showToast(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);

    try {
      const verifyOptions = authMethod === 'phone'
        ? { phone: phoneNumber, token: otp, type: 'sms' as const }
        : { email: email, token: otp, type: 'email' as const };

      const { data, error } = await supabase.auth.verifyOtp(verifyOptions);

      if (error) throw error;

      if (data.session && data.user) {
        setAuthenticatedUser(data.user, data.session);
      }
    } catch (err) {
      console.error('Failed to verify OTP:', err);
      showToast(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsOtpSent(false);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + space[8],
            paddingBottom: insets.bottom + space[4],
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Box style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="car" size={32} color={colors.primary} />
          </View>
        </Box>

        {/* Title */}
        <Text style={styles.title}>
          {isOtpSent ? 'Enter code' : 'Welcome to Rora'}
        </Text>
        <Text style={styles.subtitle}>
          {isOtpSent
            ? `We sent a code to ${authMethod === 'phone' ? phoneNumber : email}`
            : 'Enter your phone number to get started'}
        </Text>

        {!isOtpSent ? (
          <>
            {/* Phone Input (Primary) */}
            {authMethod === 'phone' && (
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoCapitalize="none"
                autoComplete="tel"
              />
            )}

            {/* Email Input (Secondary) */}
            {authMethod === 'email' && (
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
              />
            )}

            {/* Switch Auth Method - Text Link */}
            <Pressable
              onPress={() => setAuthMethod(authMethod === 'phone' ? 'email' : 'phone')}
              style={styles.switchMethod}
            >
              <Text variant="bodySmall" style={styles.switchMethodText}>
                {authMethod === 'phone' ? 'Use email instead' : 'Use phone instead'}
              </Text>
            </Pressable>

            {/* Submit Button */}
            <Button
              label={authMethod === 'phone' ? 'Continue' : 'Send link'}
              onPress={handleSendOtp}
              loading={isLoading}
              disabled={authMethod === 'phone' ? !phoneNumber : !email}
            />
          </>
        ) : (
          <>
            {/* OTP Input */}
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
            />

            {/* Verify Button */}
            <Button
              label="Verify code"
              onPress={handleVerifyOtp}
              loading={isLoading}
              disabled={otp.length !== 6}
            />

            {/* Back Link */}
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text variant="bodySmall" style={styles.backButtonText}>
                Use a different {authMethod === 'phone' ? 'number' : 'email'}
              </Text>
            </Pressable>
          </>
        )}

        {/* Footer */}
        <Box style={styles.footer}>
          <Text variant="caption" muted style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space[4],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: space[6],
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.title1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: space[2],
  },
  subtitle: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: space[6],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space[4],
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: space[4],
    minHeight: 52,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
  },
  switchMethod: {
    marginBottom: space[4],
    alignItems: 'center',
    minHeight: 44, // Touch target
    justifyContent: 'center',
  },
  switchMethodText: {
    color: colors.primary,
  },
  backButton: {
    marginTop: space[4],
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.primary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: space[8],
  },
  footerText: {
    textAlign: 'center',
  },
});
