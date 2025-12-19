import { create } from 'zustand';
import type { Trip, TripStatus } from '@/types/trip';

interface TripHistoryStore {
  trips: Trip[];
  addTrip: (trip: Trip) => void;
  updateTripStatus: (id: string, status: TripStatus, driverId?: string) => void;
  getTripById: (id: string) => Trip | undefined;
  getRecentTrips: (limit?: number) => Trip[];
  getNotTakenTrips: () => Trip[];
  reset: () => void;
}

export const useTripHistoryStore = create<TripHistoryStore>((set, get) => ({
  trips: [],

  addTrip: (trip) => {
    set((state) => ({
      trips: [trip, ...state.trips],
    }));
  },

  updateTripStatus: (id, status, driverId) => {
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === id ? { ...trip, status, ...(driverId && { driverId }) } : trip
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

  reset: () => {
    set({ trips: [] });
  },
}));

