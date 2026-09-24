import axios from 'axios';
import { apiClient } from './apiClient';

/**
 * ============================================================
 * ROUTING & DISTANCE MATRIX SERVICE
 * ============================================================
 *
 * Current Active Provider: OpenRouteService / Geoapify / Haversine Road Engine
 *
 * GOOGLE MAPS IMPLEMENTATION - PRESERVED FOR FUTURE USE:
 * Google Routes API (New) ComputeRouteMatrix implementation preserved below
 * and switchable through configuration (EXPO_PUBLIC_MAP_PROVIDER='google').
 */

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface RouteMatrixElement {
  destinationIndex: number;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteGeometry {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  distanceFormatted: string;
  durationFormatted: string;
}

export const googleRoutesService = {
  /**
   * Calculates straight-line geographical distance between two coordinates in kilometers (Haversine formula).
   */
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Computes road distance and travel duration matrix for a list of destinations.
   */
  async computeRouteMatrix(
    originLat: number,
    originLng: number,
    destinations: { latitude: number; longitude: number }[]
  ): Promise<RouteMatrixElement[]> {
    if (destinations.length === 0) return [];

    // 1. If Google provider is explicitly enabled and key is present
    if (process.env.EXPO_PUBLIC_MAP_PROVIDER === 'google' && GOOGLE_API_KEY) {
      return this.executeGoogleRouteMatrix(originLat, originLng, destinations);
    }

    // 2. Default Free / Open Matrix (1.22x road factor, 28 km/h urban traffic speed)
    return destinations.map((dest, idx) => {
      const straightDistKm = this.calculateHaversineDistance(
        originLat,
        originLng,
        dest.latitude,
        dest.longitude
      );
      const roadDistKm = straightDistKm * 1.22;
      const distanceMeters = Math.max(100, Math.floor(roadDistKm * 1000));
      const durationSeconds = Math.max(60, Math.floor((roadDistKm / 28) * 3600));

      return {
        destinationIndex: idx,
        distanceMeters,
        durationSeconds,
      };
    });
  },

  /**
   * Fetches full road path coordinates from the backend route service.
   */
  async getRouteGeometry(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<RouteGeometry> {
    try {
      const res = await apiClient.get('/clinics/route', {
        params: { originLat, originLng, destLat, destLng },
      });
      if (res.data?.success && res.data.route) {
        return res.data.route;
      }
    } catch (err: any) {
      console.warn('Backend route geometry notice:', err.message);
    }

    // Fallback curve
    const distKm = this.calculateHaversineDistance(originLat, originLng, destLat, destLng) * 1.22;
    const distanceMeters = Math.max(100, Math.floor(distKm * 1000));
    const durationSeconds = Math.max(60, Math.floor((distKm / 28) * 3600));

    const midLat = (originLat + destLat) / 2 + 0.0025;
    const midLng = (originLng + destLng) / 2 - 0.002;

    return {
      coordinates: [
        [originLat, originLng],
        [midLat, midLng],
        [destLat, destLng],
      ],
      distanceMeters,
      durationSeconds,
      distanceFormatted: `${distKm.toFixed(1)} km`,
      durationFormatted: `${Math.max(1, Math.round(durationSeconds / 60))} min`,
    };
  },

  /**
   * ============================================================
   * GOOGLE ROUTES IMPLEMENTATION - PRESERVED FOR FUTURE USE
   * ============================================================
   */
  async executeGoogleRouteMatrix(
    originLat: number,
    originLng: number,
    destinations: { latitude: number; longitude: number }[]
  ): Promise<RouteMatrixElement[]> {
    try {
      const response = await axios.post(
        'https://routes.googleapis.com/v1/computeRouteMatrix',
        {
          origins: [
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: originLat,
                    longitude: originLng,
                  },
                },
              },
            },
          ],
          destinations: destinations.map((dest) => ({
            waypoint: {
              location: {
                latLng: {
                  latitude: dest.latitude,
                  longitude: dest.longitude,
                },
              },
            },
          })),
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration,status',
          },
        }
      );

      const matrixElements = response.data || [];
      return matrixElements.map((element: any) => {
        const durationStr = element.duration || '0s';
        const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 0;

        return {
          destinationIndex: element.destinationIndex ?? 0,
          distanceMeters: element.distanceMeters ?? 0,
          durationSeconds: durationSeconds,
        };
      });
    } catch (err: any) {
      console.error('Google Routes Matrix API error:', err.message || err);
      return destinations.map((dest, idx) => {
        const distanceKm = this.calculateHaversineDistance(
          originLat,
          originLng,
          dest.latitude,
          dest.longitude
        );
        return {
          destinationIndex: idx,
          distanceMeters: Math.floor(distanceKm * 1000),
          durationSeconds: Math.floor((distanceKm / 30) * 3600),
        };
      });
    }
  },
};
