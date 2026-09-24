import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { DiscoveredClinic, LocationCoords } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { mapService } from '../services/mapService';

interface InteractiveMapProps {
  clinics: DiscoveredClinic[];
  selectedClinicId: string | null;
  onSelectClinic: (clinic: DiscoveredClinic) => void;
  centerCoords: LocationCoords;
  showRoute?: boolean;
}

declare global {
  interface Window {
    L: any;
    __onClinicMarkerClick: (clinicId: string) => void;
  }
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  clinics,
  selectedClinicId,
  onSelectClinic,
  centerCoords,
  showRoute = true,
}) => {
  const { isDark } = useThemeStore();
  const mapContainerId = useRef(`interactive-map-${Math.random().toString(36).substring(7)}`).current;
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routeBadgeMarkerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.__onClinicMarkerClick = (clinicId: string) => {
        const found = clinics.find((c) => c.id === clinicId);
        if (found) {
          onSelectClinic(found);
        }
      };
    }
  }, [clinics, onSelectClinic]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-dark-style')) {
        const style = document.createElement('style');
        style.id = 'leaflet-dark-style';
        style.innerHTML = `
          .dark-map-tiles {
            filter: brightness(0.6) invert(1) contrast(2.2) hue-rotate(200deg) saturate(0.35) !important;
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(2.4); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          initMap();
        };
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      const container = document.getElementById(mapContainerId);
      if (!container || !window.L) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = window.L.map(mapContainerId, {
        center: [centerCoords.latitude, centerCoords.longitude],
        zoom: 13,
        zoomControl: false,
        maxZoom: 19,
        minZoom: 9,
      });

      const tileConfig = mapService.getTileConfig(isDark);
      window.L.tileLayer(tileConfig.tileUrl, {
        maxZoom: tileConfig.maxZoom,
        minZoom: tileConfig.minZoom,
        attribution: tileConfig.attribution,
        className: isDark ? 'dark-map-tiles' : '',
      }).addTo(map);

      window.L.control.zoom({ position: 'topright' }).addTo(map);

      leafletMapRef.current = map;
      setIsLoaded(true);
      renderMapContent();
    };

    const renderMapContent = () => {
      const map = leafletMapRef.current;
      if (!map || !window.L) return;

      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }
      if (routeBadgeMarkerRef.current) {
        map.removeLayer(routeBadgeMarkerRef.current);
        routeBadgeMarkerRef.current = null;
      }

      const userPinHtml = `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(13, 71, 201, 0.25);
            animation: pulse-ring 1.8s infinite;
          "></div>
          <div style="
            width: 18px;
            height: 18px;
            background-color: #0D47C9;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(13, 71, 201, 0.8);
            z-index: 2;
          "></div>
        </div>
      `;
      const userPinIcon = window.L.divIcon({
        html: userPinHtml,
        className: 'user-location-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      userMarkerRef.current = window.L.marker([centerCoords.latitude, centerCoords.longitude], {
        icon: userPinIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      const selectedClinic = clinics.find((c) => c.id === selectedClinicId);

      clinics.forEach((clinic) => {
        const lat = clinic.latitude || centerCoords.latitude;
        const lng = clinic.longitude || centerCoords.longitude;
        const isSelected = clinic.id === selectedClinicId;
        const iconEmoji = mapService.getCategoryIcon(clinic.department || 'General Medicine');

        const markerBg = isSelected ? '#FF8A00' : '#0D47C9';
        const markerBorder = '#FFFFFF';
        const markerSize = isSelected ? 42 : 32;
        const glowStyle = isSelected
          ? 'box-shadow: 0 0 22px rgba(255, 138, 0, 0.95); transform: scale(1.15); z-index: 999;'
          : 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);';

        const iconHtml = `
          <div style="
            width: ${markerSize}px;
            height: ${markerSize}px;
            background-color: ${markerBg};
            border: ${isSelected ? '3px' : '2px'} solid ${markerBorder};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: ${isSelected ? '18px' : '14px'};
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            ${glowStyle}
          ">
            ${iconEmoji}
          </div>
        `;

        const customIcon = window.L.divIcon({
          html: iconHtml,
          className: 'clinic-map-pin',
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });

        const marker = window.L.marker([lat, lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 900 : 100,
        }).addTo(map);

        marker.on('click', () => {
          if (window.__onClinicMarkerClick) {
            window.__onClinicMarkerClick(clinic.id);
          }
        });

        markersRef.current.push(marker);
      });

      if (showRoute && selectedClinic && selectedClinic.latitude && selectedClinic.longitude) {
        const start = [centerCoords.latitude, centerCoords.longitude];
        const end = [selectedClinic.latitude, selectedClinic.longitude];

        const midLat = (start[0] + end[0]) / 2 + 0.0025;
        const midLng = (start[1] + end[1]) / 2 - 0.002;
        const routeCoords = [start, [midLat, midLng], end];

        const routeStyle = mapService.getRouteStyle(isDark);
        routePolylineRef.current = window.L.polyline(routeCoords, routeStyle).addTo(map);

        const badgeLabel = mapService.formatRouteBadge(selectedClinic.travelTime, selectedClinic.distance);
        const badgeHtml = `
          <div style="
            background-color: ${isDark ? '#06152F' : '#FFFFFF'};
            color: ${isDark ? '#FFFFFF' : '#0B1736'};
            border: 1.5px solid #0D47C9;
            border-radius: 20px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            gap: 4px;
            pointer-events: none;
          ">
            ${badgeLabel}
          </div>
        `;

        const badgeIcon = window.L.divIcon({
          html: badgeHtml,
          className: 'route-info-badge',
          iconSize: [110, 26],
          iconAnchor: [55, 13],
        });

        routeBadgeMarkerRef.current = window.L.marker([midLat, midLng], {
          icon: badgeIcon,
          zIndexOffset: 850,
        }).addTo(map);

        const bounds = window.L.latLngBounds([start, end]);
        map.fitBounds(bounds, { padding: [70, 70], animate: true });
      } else if (selectedClinic && selectedClinic.latitude && selectedClinic.longitude) {
        map.panTo([selectedClinic.latitude, selectedClinic.longitude], { animate: true, duration: 0.5 });
      } else if (clinics.length > 0) {
        const allPoints = clinics
          .filter((c) => c.latitude && c.longitude)
          .map((c) => [c.latitude, c.longitude]);
        allPoints.push([centerCoords.latitude, centerCoords.longitude]);
        const bounds = window.L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      } else {
        map.panTo([centerCoords.latitude, centerCoords.longitude], { animate: true, duration: 0.5 });
      }
    };

    loadLeaflet();
  }, [clinics, selectedClinicId, centerCoords, isDark, showRoute]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#06152F' : '#F8FAFC' }]}>
        <Text style={[styles.fallbackTitle, { color: isDark ? '#FFFFFF' : '#0B1736' }]}>📍 Chennai Healthcare Map</Text>
        <Text style={[styles.fallbackSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {clinics.length} clinics discovered around {centerCoords.latitude.toFixed(2)}, {centerCoords.longitude.toFixed(2)}.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div id={mapContainerId} style={{ width: '100%', height: '100%' }} />
      {!isLoaded && (
        <View style={[styles.loaderOverlay, { backgroundColor: isDark ? '#06152F' : '#FFFFFF' }]}>
          <ActivityIndicator size="large" color="#0D47C9" />
          <Text style={[styles.loadingText, { color: isDark ? '#F8FAFC' : '#64748B' }]}>
            Loading Chennai Healthcare Map...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 40,
  },
  fallbackSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
});
