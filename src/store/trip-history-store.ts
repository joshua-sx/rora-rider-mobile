import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, TripStatus } from '@/src/types/trip';

// Valid status transitions
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  not_taken: ['pending', 'cancelled'],
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

interface TripHistoryStore {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
  updateTripStatus: (id: string, status: TripStatus, driverId?: string) => void;
  confirmTrip: (id: string, method: 'qr_scan' | 'manual_code') => void;
  completeTrip: (id: string, completedBy: 'passenger' | 'driver') => void;
  toggleSaved: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;
  getRecentTrips: (limit?: number) => Trip[];
  getNotTakenTrips: () => Trip[];
  getSavedTrips: () => Trip[];
  getAvailableTrips: () => Trip[];
  deleteTrip: (id: string) => void;
  reset: () => void;
}

export const useTripHistoryStore = create<TripHistoryStore>()(
  persist(
    (set, get) => ({
      trips: [],

  addTrip: (trip) => {
    set((state) => ({
      trips: [trip, ...state.trips],
    }));
  },

  updateTripStatus: (id, status, driverId) => {
    set((state) => ({
      trips: state.trips.map((trip) => {
        if (trip.id !== id) return trip;

        // Validate transition
        const validNext = VALID_TRANSITIONS[trip.status];
        if (!validNext.includes(status)) {
          console.warn(`[trip-store] Invalid status transition: ${trip.status} -> ${status}`);
          return trip;
        }

        return {
          ...trip,
          status,
          driverId:
            status === 'not_taken' || status === 'cancelled'
              ? undefined
              : driverId ?? trip.driverId,
        };
      }),
    }));
  },

  confirmTrip: (id, method) => {
    set((state) => ({
      trips: state.trips.map((trip) => {
        if (trip.id !== id) return trip;

        // Validate transition to in_progress
        const validNext = VALID_TRANSITIONS[trip.status];
        if (!validNext.includes('in_progress')) {
          console.warn(`[trip-store] Cannot confirm trip from status: ${trip.status}`);
          return trip;
        }

        return {
          ...trip,
          status: 'in_progress',
          confirmationMethod: method,
          confirmedAt: new Date().toISOString(),
          confirmedBy: 'driver',
        };
      }),
    }));
  },

  completeTrip: (id, completedBy) => {
    set((state) => ({
      trips: state.trips.map((trip) => {
        if (trip.id !== id) return trip;

        // Validate transition to completed
        const validNext = VALID_TRANSITIONS[trip.status];
        if (!validNext.includes('completed')) {
          console.warn(`[trip-store] Cannot complete trip from status: ${trip.status}`);
          return trip;
        }

        return {
          ...trip,
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy,
        };
      }),
    }));
  },

  toggleSaved: (id) => {
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              saved: !trip.saved,
            }
          : trip
      ),
    }));
  },

  getTripById: (id) => {
    return get().trips.find((trip) => trip.id === id);
  },

  getRecentTrips: (limit = 10) => {
    return get().trips.slice(0, limit);
  },

  getNotTakenTrips: () => {
    return get().trips.filter((trip) => trip.status === 'not_taken');
  },

  getSavedTrips: () => {
    return get().trips.filter((trip) => trip.saved === true);
  },

  getAvailableTrips: () => {
    return get().trips.filter((trip) => trip.status === 'not_taken' && trip.saved === true);
  },

  deleteTrip: (id) => {
    set((state) => ({
      trips: state.trips.filter((trip) => trip.id !== id),
    }));
  },

  reset: () => {
    set({ trips: [] });
  },
    }),
    {
      name: 'trip-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
