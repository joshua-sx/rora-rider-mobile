import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedLocation {
  id: string;
  label: string; // "Home", "Work", or custom
  name: string; // Full address name
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  createdAt: string;
}

interface SavedLocationsStore {
  locations: SavedLocation[];
  addLocation: (location: Omit<SavedLocation, 'id' | 'createdAt'>) => void;
  updateLocation: (id: string, updates: Partial<Omit<SavedLocation, 'id' | 'createdAt'>>) => void;
  removeLocation: (id: string) => void;
  getLocationByLabel: (label: string) => SavedLocation | undefined;
  getHomeLocation: () => SavedLocation | undefined;
  getWorkLocation: () => SavedLocation | undefined;
}

export const useSavedLocationsStore = create<SavedLocationsStore>()(
  persist(
    (set, get) => ({
      locations: [],

      addLocation: (location) => {
        const newLocation: SavedLocation = {
          ...location,
          id: `location-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          locations: [newLocation, ...state.locations],
        }));
      },

      updateLocation: (id, updates) => {
        set((state) => ({
          locations: state.locations.map((location) =>
            location.id === id ? { ...location, ...updates } : location
          ),
        }));
      },

      removeLocation: (id) => {
        set((state) => ({
          locations: state.locations.filter((location) => location.id !== id),
        }));
      },

      getLocationByLabel: (label) => {
        return get().locations.find((location) => location.label === label);
      },

      getHomeLocation: () => {
        return get().locations.find((location) => location.label === 'Home');
      },

      getWorkLocation: () => {
        return get().locations.find((location) => location.label === 'Work');
      },
    }),
    {
      name: 'saved-locations-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
