import { LocationCoords } from '../types';

export type MapProviderType = 'maplibre' | 'google';

export const CHENNAI_DEFAULT_COORDS: LocationCoords = {
  latitude: 13.0338,
  longitude: 80.2677,
};

export const CHENNAI_BOUNDS = {
  minLat: 12.80,
  maxLat: 13.25,
  minLng: 79.95,
  maxLng: 80.35,
};

export interface MapStyleConfig {
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  backgroundColor: string;
}

export const mapService = {
  getActiveProvider(): MapProviderType {
    const provider = process.env.EXPO_PUBLIC_MAP_PROVIDER;
    if (provider === 'google') {
      return 'google';
    }
    return 'maplibre';
  },

  getTileConfig(isDark: boolean): MapStyleConfig {
    if (isDark) {
      return {
        tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 9,
        backgroundColor: '#06152F',
      };
    }

    return {
      tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 9,
      backgroundColor: '#F8FAFC',
    };
  },

  getCategoryIcon(category: string): string {
    const categoryIconMap: Record<string, string> = {
      'General Medicine': '🩺',
      Cardiology: '❤️',
      Dermatology: '✨',
      Ophthalmology: '👁️',
      Dentistry: '🦷',
      ENT: '👂',
      Pediatrics: '👶',
      Orthopedics: '🦴',
      Gynecology: '🌸',
      Neurology: '🧠',
    };
    return categoryIconMap[category] || '🏥';
  },

  getRouteStyle(isDark: boolean) {
    return {
      color: '#0D47C9',
      weight: 5.5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    };
  },

  formatRouteBadge(travelTime?: string, distance?: string): string {
    const time = travelTime || '5 min';
    const dist = distance || '1.2 km';
    return `🚗 ${time} · 📍 ${dist}`;
  },
};
