import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Star, MapPin, Clock, ChevronRight, Navigation } from 'lucide-react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { Clinic } from '../types';
import { useThemeStore } from '../store/useThemeStore';

interface ClinicCardProps {
  clinic: Clinic;
  onPress?: () => void;
  horizontal?: boolean;
  style?: object;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  onPress,
  horizontal = false,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const isOpen = clinic.isOpen !== false;

  if (horizontal) {
    // Horizontal card for scroll rails
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.hCard,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            style,
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Image source={{ uri: clinic.image }} style={styles.hImage} />
          <View style={styles.hContent}>
            <Text style={[styles.hName, { color: theme.textPrimary }]} numberOfLines={1}>
              {clinic.name}
            </Text>
            <View style={styles.ratingRow}>
              <Star size={11} fill="#F59E0B" color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.textPrimary }]}>{clinic.rating}</Text>
              <Text style={[styles.ratingCount, { color: theme.textMuted }]}>({clinic.reviewsCount})</Text>
            </View>
            <View style={styles.hMetaRow}>
              <MapPin size={10} color={theme.textMuted} />
              <Text style={[styles.hMeta, { color: theme.textSecondary }]}>{clinic.distance}</Text>
              {clinic.travelTime && (
                <>
                  <Text style={[styles.hMetaDot, { color: theme.textMuted }]}>·</Text>
                  <Text style={[styles.hMeta, { color: theme.textSecondary }]}>{clinic.travelTime}</Text>
                </>
              )}
            </View>
            <View style={styles.hBottom}>
              <View style={[styles.statusChip, { backgroundColor: isOpen ? theme.successLight : theme.errorLight }]}>
                <View style={[styles.statusDot, { backgroundColor: isOpen ? theme.success : theme.error }]} />
                <Text style={[styles.statusLabel, { color: isOpen ? theme.success : theme.error }]}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
              <Text style={[styles.docCount, { color: theme.textMuted }]}>
                {clinic.doctorsCount} doctors
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Vertical full-width card
  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.vCard,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.vRow}>
          <Image source={{ uri: clinic.image }} style={styles.vImage} />
          <View style={styles.vContent}>
            <Text style={[styles.vName, { color: theme.textPrimary }]} numberOfLines={1}>
              {clinic.name}
            </Text>
            <Text style={[styles.vCategory, { color: theme.primary }]}>{clinic.category}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.textPrimary }]}>{clinic.rating}</Text>
              <Text style={[styles.ratingCount, { color: theme.textMuted }]}>({clinic.reviewsCount})</Text>
            </View>
            <View style={styles.vMetaRow}>
              <View style={styles.metaItem}>
                <MapPin size={11} color={theme.textMuted} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{clinic.distance}</Text>
              </View>
              {clinic.travelTime && (
                <View style={styles.metaItem}>
                  <Navigation size={11} color={theme.textMuted} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>{clinic.travelTime}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.vRightCol}>
            <View style={[styles.statusChip, { backgroundColor: isOpen ? theme.successLight : theme.errorLight }]}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? theme.success : theme.error }]} />
              <Text style={[styles.statusLabel, { color: isOpen ? theme.success : theme.error }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
            {clinic.waitTime && (
              <Text style={[styles.waitTime, { color: theme.textMuted }]}>~{clinic.waitTime}</Text>
            )}
            <TouchableOpacity
              style={[styles.viewBtn, { backgroundColor: theme.cta }]}
              onPress={onPress}
            >
              <Text style={styles.viewBtnText}>View</Text>
              <ChevronRight size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Horizontal card (rail)
  hCard: {
    width: 200,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  hImage: {
    width: '100%',
    height: 88,
    resizeMode: 'cover',
  },
  hContent: {
    padding: 10,
    gap: 3,
  },
  hName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCount: {
    fontSize: 10,
  },
  hMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hMeta: {
    fontSize: 11,
  },
  hMetaDot: {
    fontSize: 11,
  },
  hBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  docCount: {
    fontSize: 10,
  },
  // Vertical card (search results)
  vCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 12,
    ...SHADOWS.card,
  },
  vRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vImage: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.sm,
    resizeMode: 'cover',
  },
  vContent: {
    flex: 1,
    gap: 2,
  },
  vName: {
    fontSize: 14,
    fontWeight: '700',
  },
  vCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  vMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
  },
  vRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  waitTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
