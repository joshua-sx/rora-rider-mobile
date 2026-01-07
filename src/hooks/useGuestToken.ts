import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const GUEST_TOKEN_KEY = '@rora/guest_token';
const GUEST_TOKEN_EXPIRY_KEY = '@rora/guest_token_expiry';

interface GuestTokenData {
  token: string;
  expiresAt: string;
}

/**
 * Error types for guest token operations
 */
export type GuestTokenErrorType =
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'EXPIRED'
  | 'UNKNOWN';

/**
 * Result type for guest token operations
 */
export interface GuestTokenResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: GuestTokenErrorType;
}

export const useGuestToken = () => {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<GuestTokenErrorType | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  /**
   * Set error with type
   */
  const setErrorState = useCallback((message: string, type: GuestTokenErrorType) => {
    setError(message);
    setErrorType(type);
  }, []);

  /**
   * Load guest token from AsyncStorage
   * Returns a result object that distinguishes between "no token" and "load error"
   */
  const loadGuestToken = async (): Promise<GuestTokenResult<GuestTokenData | null>> => {
    try {
      const [token, expiresAt] = await Promise.all([
        AsyncStorage.getItem(GUEST_TOKEN_KEY),
        AsyncStorage.getItem(GUEST_TOKEN_EXPIRY_KEY),
      ]);

      if (token && expiresAt) {
        // Check if token is expired
        const now = new Date();
        const expiry = new Date(expiresAt);

        if (now < expiry) {
          return { success: true, data: { token, expiresAt } };
        } else {
          // Token expired, clear it
          await clearGuestToken();
          return { success: true, data: null }; // No error, just expired
        }
      }

      return { success: true, data: null }; // No token exists
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Failed to load guest token: ${err.message}`
        : 'Failed to load guest token: Unknown error';
      console.error('[useGuestToken]', errorMessage);
      return { success: false, error: errorMessage, errorType: 'STORAGE_ERROR' };
    }
  };

  /**
   * Create a new guest token
   * Returns a result object with detailed error information
   */
  const createGuestToken = async (): Promise<GuestTokenResult<GuestTokenData>> => {
    clearError();

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-guest-token',
        {
          body: {},
        }
      );

      if (error) {
        const errorMessage = `Failed to create guest token: ${error.message}`;
        console.error('[useGuestToken]', errorMessage);
        setErrorState(errorMessage, 'SERVER_ERROR');
        return { success: false, error: errorMessage, errorType: 'SERVER_ERROR' };
      }

      if (!data?.success || !data?.token) {
        const errorMessage = 'Server returned invalid response when creating guest token';
        console.error('[useGuestToken]', errorMessage);
        setErrorState(errorMessage, 'SERVER_ERROR');
        return { success: false, error: errorMessage, errorType: 'SERVER_ERROR' };
      }

      const tokenData: GuestTokenData = {
        token: data.token,
        expiresAt: data.expires_at,
      };

      // Store in AsyncStorage
      try {
        await Promise.all([
          AsyncStorage.setItem(GUEST_TOKEN_KEY, tokenData.token),
          AsyncStorage.setItem(GUEST_TOKEN_EXPIRY_KEY, tokenData.expiresAt),
        ]);
      } catch (storageErr) {
        const errorMessage = storageErr instanceof Error
          ? `Failed to persist guest token: ${storageErr.message}`
          : 'Failed to persist guest token: Unknown error';
        console.error('[useGuestToken]', errorMessage);
        // Still set the token in state even if storage fails
        setGuestToken(tokenData.token);
        setErrorState(errorMessage, 'STORAGE_ERROR');
        return { success: true, data: tokenData, error: errorMessage, errorType: 'STORAGE_ERROR' };
      }

      setGuestToken(tokenData.token);
      return { success: true, data: tokenData };
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Failed to create guest token: ${err.message}`
        : 'Failed to create guest token: Unknown error';
      console.error('[useGuestToken]', errorMessage);
      setErrorState(errorMessage, 'NETWORK_ERROR');
      return { success: false, error: errorMessage, errorType: 'NETWORK_ERROR' };
    }
  };

  /**
   * Validate guest token with backend
   * Returns a result object that distinguishes between "invalid token" and "validation error"
   */
  const validateGuestToken = async (token: string): Promise<GuestTokenResult<boolean>> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'validate-guest-token',
        {
          body: { token },
        }
      );

      if (error) {
        const errorMessage = `Token validation request failed: ${error.message}`;
        console.warn('[useGuestToken]', errorMessage);
        return { success: false, error: errorMessage, errorType: 'SERVER_ERROR' };
      }

      if (!data?.valid) {
        // Token is invalid but we successfully checked it
        return { success: true, data: false };
      }

      return { success: true, data: true };
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Failed to validate guest token: ${err.message}`
        : 'Failed to validate guest token: Unknown error';
      console.error('[useGuestToken]', errorMessage);
      return { success: false, error: errorMessage, errorType: 'NETWORK_ERROR' };
    }
  };

  /**
   * Clear guest token from storage
   * Returns a result object indicating success or failure
   */
  const clearGuestToken = async (): Promise<GuestTokenResult<void>> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(GUEST_TOKEN_KEY),
        AsyncStorage.removeItem(GUEST_TOKEN_EXPIRY_KEY),
      ]);
      setGuestToken(null);
      clearError();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Failed to clear guest token: ${err.message}`
        : 'Failed to clear guest token: Unknown error';
      console.error('[useGuestToken]', errorMessage);
      // Still clear the state even if storage removal fails
      setGuestToken(null);
      return { success: false, error: errorMessage, errorType: 'STORAGE_ERROR' };
    }
  };

  /**
   * Initialize guest token on first load
   */
  useEffect(() => {
    const initializeGuestToken = async () => {
      setIsLoading(true);
      clearError();

      // Try to load existing token
      const loadResult = await loadGuestToken();

      if (!loadResult.success) {
        // Storage error - try to create a new token anyway
        console.warn('[useGuestToken] Failed to load token, creating new one');
        await createGuestToken();
        setIsLoading(false);
        return;
      }

      const existingToken = loadResult.data;

      if (existingToken) {
        // Validate with backend
        const validationResult = await validateGuestToken(existingToken.token);

        if (!validationResult.success) {
          // Validation request failed - use existing token anyway (might work offline)
          console.warn('[useGuestToken] Could not validate token, using existing');
          setGuestToken(existingToken.token);
        } else if (validationResult.data) {
          // Token is valid
          setGuestToken(existingToken.token);
        } else {
          // Token invalid, create new one
          await createGuestToken();
        }
      } else {
        // No token exists, create new one
        await createGuestToken();
      }

      setIsLoading(false);
    };

    initializeGuestToken();
  }, []);

  return {
    guestToken,
    isLoading,
    error,
    errorType,
    clearError,
    createGuestToken,
    validateGuestToken,
    clearGuestToken,
  };
};
