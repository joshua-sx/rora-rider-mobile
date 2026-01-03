import { create } from 'zustand';

interface FavoriteDriversStore {
  favoriteDriverIds: string[];
  addFavorite: (driverId: string) => void;
  removeFavorite: (driverId: string) => void;
  isFavorite: (driverId: string) => boolean;
  toggleFavorite: (driverId: string) => void;
}

export const useFavoriteDriversStore = create<FavoriteDriversStore>((set, get) => ({
  favoriteDriverIds: [],

  addFavorite: (driverId) => {
    set((state) => {
      if (state.favoriteDriverIds.includes(driverId)) {
        return state;
      }
      return {
        favoriteDriverIds: [...state.favoriteDriverIds, driverId],
      };
    });
  },

  removeFavorite: (driverId) => {
    set((state) => ({
      favoriteDriverIds: state.favoriteDriverIds.filter((id) => id !== driverId),
    }));
  },

  isFavorite: (driverId) => {
    return get().favoriteDriverIds.includes(driverId);
  },

  toggleFavorite: (driverId) => {
    const { isFavorite, addFavorite, removeFavorite } = get();
    if (isFavorite(driverId)) {
      removeFavorite(driverId);
    } else {
      addFavorite(driverId);
    }
  },
}));
