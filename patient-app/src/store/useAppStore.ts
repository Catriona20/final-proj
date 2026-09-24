import { create } from 'zustand';
import { ActiveLocation, SavedLocation } from '../types';
import { PRESET_LOCATIONS, DEFAULT_SAVED_LOCATIONS, locationService } from '../services/locationService';

interface AppStoreState {
  activeLocation: ActiveLocation;
  savedLocations: SavedLocation[];
  selectedCategory: string | null;
  searchQuery: string;
  isFirstLaunch: boolean;
  isGpsActive: boolean;
  gpsError: string | null;

  setActiveLocation: (loc: ActiveLocation) => void;
  setSavedLocations: (saved: SavedLocation[]) => void;
  addSavedLocation: (loc: SavedLocation) => void;
  setSelectedCategory: (cat: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsFirstLaunch: (isFirst: boolean) => void;
  startGpsWatching: () => () => void;
  requestCurrentGpsLocation: () => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set) => ({
  activeLocation: PRESET_LOCATIONS[0], // Default: Mylapore, Chennai
  savedLocations: DEFAULT_SAVED_LOCATIONS,
  selectedCategory: null,
  searchQuery: '',
  isFirstLaunch: false,
  isGpsActive: false,
  gpsError: null,

  setActiveLocation: (activeLocation) => set({ activeLocation, isGpsActive: activeLocation.type === 'gps' }),
  setSavedLocations: (savedLocations) => set({ savedLocations }),
  addSavedLocation: (loc) =>
    set((state) => ({
      savedLocations: [loc, ...state.savedLocations.filter((s) => s.id !== loc.id)],
    })),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsFirstLaunch: (isFirstLaunch) => set({ isFirstLaunch }),

  startGpsWatching: () => {
    const unwatch = locationService.watchLiveLocation(
      (gpsLoc) => {
        set({ activeLocation: gpsLoc, isGpsActive: true, gpsError: null });
      },
      (err) => {
        console.warn('Live GPS watch notice:', err);
        set({ gpsError: err.message });
      }
    );
    return unwatch;
  },

  requestCurrentGpsLocation: async () => {
    try {
      const coords = await locationService.getCurrentLocation();
      const locality = await locationService.reverseGeocode(coords);
      set({
        activeLocation: {
          id: 'loc-live-gps',
          name: locality.name,
          locality: locality.locality,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: coords.timestamp || Date.now(),
          type: 'gps',
          label: 'Current Location',
        },
        isGpsActive: true,
        gpsError: null,
      });
    } catch (e: any) {
      set({ gpsError: e.message });
    }
  },
}));

