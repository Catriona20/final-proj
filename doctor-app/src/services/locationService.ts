import { Platform } from 'react-native';
import { LocationCoords } from '../types';

export interface DoctorActiveLocation {
  id: string;
  name: string;
  locality: string;
  latitude: number;
  longitude: number;
  type: 'gps' | 'preset' | 'searched';
}

export const CHENNAI_PRESET_LOCATIONS: DoctorActiveLocation[] = [
  {
    id: 'loc-adyar',
    name: 'Adyar',
    locality: 'Adyar, Chennai',
    latitude: 13.0067,
    longitude: 80.2206,
    type: 'preset',
  },
  {
    id: 'loc-mylapore',
    name: 'Mylapore',
    locality: 'Mylapore, Chennai',
    latitude: 13.0368,
    longitude: 80.2676,
    type: 'preset',
  },
  {
    id: 'loc-tnagar',
    name: 'T. Nagar',
    locality: 'T. Nagar, Chennai',
    latitude: 13.0405,
    longitude: 80.2337,
    type: 'preset',
  },
  {
    id: 'loc-annanagar',
    name: 'Anna Nagar',
    locality: 'Anna Nagar, Chennai',
    latitude: 13.0850,
    longitude: 80.2101,
    type: 'preset',
  },
  {
    id: 'loc-velachery',
    name: 'Velachery',
    locality: 'Velachery, Chennai',
    latitude: 12.9759,
    longitude: 80.2212,
    type: 'preset',
  },
  {
    id: 'loc-guindy',
    name: 'Guindy',
    locality: 'Guindy, Chennai',
    latitude: 13.0067,
    longitude: 80.2025,
    type: 'preset',
  },
  {
    id: 'loc-omr',
    name: 'OMR Sholinganallur',
    locality: 'OMR, Sholinganallur, Chennai',
    latitude: 12.9010,
    longitude: 80.2279,
    type: 'preset',
  },
  {
    id: 'loc-tambaram',
    name: 'Tambaram',
    locality: 'Tambaram, Chennai',
    latitude: 12.9249,
    longitude: 80.1000,
    type: 'preset',
  },
  {
    id: 'loc-porur',
    name: 'Porur',
    locality: 'Porur, Chennai',
    latitude: 13.0382,
    longitude: 80.1565,
    type: 'preset',
  },
  {
    id: 'loc-chromepet',
    name: 'Chromepet',
    locality: 'Chromepet, Chennai',
    latitude: 12.9516,
    longitude: 80.1462,
    type: 'preset',
  },
];

export const doctorLocationService = {
  getDefaultLocation(): DoctorActiveLocation {
    return CHENNAI_PRESET_LOCATIONS[0]; // Adyar, Chennai
  },

  async getCurrentLocation(): Promise<LocationCoords> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Geolocation warning, using Adyar, Chennai:', error.message);
            resolve({ latitude: 13.0067, longitude: 80.2206 });
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
        );
      });
    }
    return { latitude: 13.0067, longitude: 80.2206 };
  },

  async reverseGeocode(coords: LocationCoords): Promise<{ name: string; locality: string }> {
    const { latitude, longitude } = coords;

    for (const preset of CHENNAI_PRESET_LOCATIONS) {
      const dLat = Math.abs(preset.latitude - latitude);
      const dLng = Math.abs(preset.longitude - longitude);
      if (dLat < 0.025 && dLng < 0.025) {
        return { name: preset.name, locality: preset.locality };
      }
    }

    return {
      name: 'Chennai Practice Zone',
      locality: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  },

  searchLocations(query: string): DoctorActiveLocation[] {
    const q = query.trim().toLowerCase();
    if (!q) return CHENNAI_PRESET_LOCATIONS;

    return CHENNAI_PRESET_LOCATIONS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q)
    );
  },
};
