import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { X, Check, SlidersHorizontal, MapPin, Star, Clock } from 'lucide-react-native';
import { FilterOptions } from '../types';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterSheetProps {
  visible: boolean;
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
  onClose: () => void;
}

const SPECIALIZATIONS = [
  'All',
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Eye Care',
  'Dentistry',
  'ENT',
  'Pediatrics',
  'Orthopedics',
];

const AVAILABILITIES = [
  { key: 'all', label: 'Any Time' },
  { key: 'today', label: 'Today' },
  { key: 'now', label: 'Available Now' },
];

const RATINGS = [4.0, 4.3, 4.5, 4.7, 4.9];
const DISTANCES = [2, 5, 10, 20];

export const FilterSheet: React.FC<FilterSheetProps> = ({ visible, filters, onApply, onClose }) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      setLocalFilters(filters);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClearAll = () => {
    setLocalFilters({
      specialization: null,
      distance: 10,
      availability: 'all',
      maxWait: 60,
      minRating: 0,
      openNow: false,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  if (!isRendered) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, pointerEvents: 'box-none' }]}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <View style={styles.headerLeft}>
            <SlidersHorizontal size={18} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Filter Clinics & Care</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.backgroundSoft }]}
          >
            <X size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Specialization */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Specialization</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {SPECIALIZATIONS.map((spec) => {
                const isActive =
                  spec === 'All' ? !localFilters.specialization : localFilters.specialization === spec;
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? theme.primary : theme.backgroundSoft,
                        borderColor: isActive ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() =>
                      setLocalFilters((f) => ({ ...f, specialization: spec === 'All' ? null : spec }))
                    }
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isActive ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Search Radius */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Search Radius</Text>
            </View>
            <View style={styles.pillRow}>
              {DISTANCES.map((r) => {
                const isActive = localFilters.distance === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? theme.primary : theme.backgroundSoft,
                        borderColor: isActive ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setLocalFilters((f) => ({ ...f, distance: r }))}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isActive ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {r} km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Minimum Rating */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Star size={15} color="#F59E0B" fill="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Minimum Rating</Text>
            </View>
            <View style={styles.pillRow}>
              {RATINGS.map((r) => {
                const isActive = localFilters.minRating === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? theme.primary : theme.backgroundSoft,
                        borderColor: isActive ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() =>
                      setLocalFilters((f) => ({ ...f, minRating: f.minRating === r ? 0 : r }))
                    }
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isActive ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      ⭐ {r}+
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color={theme.success} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Doctor Availability</Text>
            </View>
            <View style={styles.pillRow}>
              {AVAILABILITIES.map((av) => {
                const isActive = localFilters.availability === av.key;
                return (
                  <TouchableOpacity
                    key={av.key}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? theme.primary : theme.backgroundSoft,
                        borderColor: isActive ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setLocalFilters((f) => ({ ...f, availability: av.key as any }))}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isActive ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {av.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Open Now Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.toggleRow, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
              onPress={() => setLocalFilters((f) => ({ ...f, openNow: !f.openNow }))}
              activeOpacity={0.85}
            >
              <View>
                <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Open Now Only</Text>
                <Text style={[styles.toggleSub, { color: theme.textMuted }]}>
                  Filter clinics actively open at this hour
                </Text>
              </View>
              <View
                style={[
                  styles.toggleCheckbox,
                  {
                    backgroundColor: localFilters.openNow ? theme.primary : theme.card,
                    borderColor: localFilters.openNow ? theme.primary : theme.cardBorder,
                  },
                ]}
              >
                {localFilters.openNow && <Check size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View style={[styles.footer, { borderTopColor: theme.cardBorder, backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSoft }]}
            onPress={handleClearAll}
          >
            <Text style={[styles.clearBtnText, { color: theme.textSecondary }]}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: theme.cta }]}
            onPress={handleApply}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 1,
    ...SHADOWS.float,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
    paddingBottom: 20,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
