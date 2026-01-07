import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Result type for auth operations that can fail
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  guestToken: string | null;
  isLoading: boolean;
  initializationError: string | null;

  // Actions
  setGuest: (guestToken: string) => void;
  setAuthenticatedUser: (user: User, session: Session) => void;
  logout: () => Promise<AuthResult>;
  initialize: () => Promise<AuthResult>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isGuest: true,
      guestToken: null,
      isLoading: true,
      initializationError: null,

      // Set guest mode
      setGuest: (guestToken: string) => {
        set({
          isGuest: true,
          guestToken,
          user: null,
          session: null,
        });
      },

      // Set authenticated user
      setAuthenticatedUser: (user: User, session: Session) => {
        set({
          isGuest: false,
          user,
          session,
          guestToken: null, // Clear guest token when authenticated
        });
      },

      // Logout - returns result to allow caller to handle errors
      logout: async (): Promise<AuthResult> => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            const errorMessage = `Logout failed: ${error.message}`;
            console.error(errorMessage);
            return { success: false, error: errorMessage };
          }
          set({
            user: null,
            session: null,
            isGuest: true,
          });
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error
            ? `Logout failed: ${error.message}`
            : 'Logout failed: Unknown error';
          console.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      // Initialize auth state from Supabase session - returns result to allow caller to handle errors
      initialize: async (): Promise<AuthResult> => {
        try {
          set({ isLoading: true, initializationError: null });

          // Get current session from Supabase
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            const errorMessage = `Failed to get session: ${error.message}`;
            console.error(errorMessage);
            set({ isLoading: false, initializationError: errorMessage });
            return { success: false, error: errorMessage };
          }

          if (session?.user) {
            // User is authenticated
            set({
              user: session.user,
              session,
              isGuest: false,
              guestToken: null,
              isLoading: false,
              initializationError: null,
            });
          } else {
            // User is guest (guest token handled by useGuestToken hook)
            set({
              user: null,
              session: null,
              isGuest: true,
              isLoading: false,
              initializationError: null,
            });
          }
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error
            ? `Auth initialization failed: ${error.message}`
            : 'Auth initialization failed: Unknown error';
          console.error(errorMessage);
          set({ isLoading: false, initializationError: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: '@rora/auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive data
      partialize: (state) => ({
        isGuest: state.isGuest,
        // Don't persist tokens or sessions (handled by Supabase)
      }),
    }
  )
);

// Setup auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState();

  if (event === 'SIGNED_IN' && session?.user) {
    store.setAuthenticatedUser(session.user, session);
  } else if (event === 'SIGNED_OUT') {
    store.logout();
  } else if (event === 'TOKEN_REFRESHED' && session) {
    store.setAuthenticatedUser(session.user, session);
  }
});
