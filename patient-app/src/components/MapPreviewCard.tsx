import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Map, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface MapPreviewCardProps {
  location: string;
  nearbyClinicsCount: number;
  onExplore?: () => void;
}

export const MapPreviewCard: React.FC<MapPreviewCardProps> = ({
  location,
  nearbyClinicsCount,
  onExplore,
}) => (
  <View style={styles.card}>
    {/* Map visual area — premium gradient placeholder */}
    <View style={styles.mapArea}>
      {/* Grid lines simulating a map */}
      <View style={styles.gridH1} />
      <View style={styles.gridH2} />
      <View style={styles.gridV1} />
      <View style={styles.gridV2} />

      {/* Location pin — center */}
      <View style={styles.pinContainer}>
        <View style={styles.pin}>
          <View style={styles.pinDot} />
        </View>
        <View style={styles.pinPulse} />
      </View>

      {/* Mock clinic dots */}
      <View style={[styles.clinicDot, { top: '30%', left: '20%' }]} />
      <View style={[styles.clinicDot, { top: '55%', right: '25%' }]} />
      <View style={[styles.clinicDot, { top: '20%', right: '35%' }]} />

      {/* Overlay label */}
      <View style={styles.overlay}>
        <Map size={14} color={COLORS.primary} />
        <Text style={styles.overlayText}>Clinics around you</Text>
      </View>
    </View>

    {/* Bottom row */}
    <View style={styles.bottomRow}>
      <View style={styles.leftInfo}>
        <Text style={styles.locationText}>{location}</Text>
        <Text style={styles.subText}>{nearbyClinicsCount} clinics within 5 km</Text>
      </View>
      <TouchableOpacity style={styles.exploreBtn} onPress={onExplore} activeOpacity={0.85}>
        <Text style={styles.exploreBtnText}>Explore</Text>
        <ArrowRight size={14} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  mapArea: {
    height: 130,
    backgroundColor: '#EEF2FF',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridH1: {
    position: 'absolute',
    height: 1,
    width: '100%',
    top: '35%',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  gridH2: {
    position: 'absolute',
    height: 1,
    width: '100%',
    top: '65%',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  gridV1: {
    position: 'absolute',
    width: 1,
    height: '100%',
    left: '30%',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  gridV2: {
    position: 'absolute',
    width: 1,
    height: '100%',
    left: '65%',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...SHADOWS.card,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  pinPulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(26,86,219,0.12)',
    zIndex: 1,
  },
  clinicDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.subtle,
  },
  overlay: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    ...SHADOWS.subtle,
  },
  overlayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  leftInfo: { flex: 1 },
  locationText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.textPrimary,
  },
  subText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  exploreBtnText: {
    ...TYPOGRAPHY.label,
    color: COLORS.white,
  },
});
