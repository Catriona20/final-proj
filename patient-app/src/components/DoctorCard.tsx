import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Star, ShieldCheck, Clock } from 'lucide-react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { Doctor } from '../types';
import { useThemeStore } from '../store/useThemeStore';

interface DoctorCardProps {
  doctor: Doctor;
  onPress?: () => void;
  onBook?: () => void;
  horizontal?: boolean;
  style?: object;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  onBook,
  horizontal = false,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };

  if (horizontal) {
    // Horizontal card for carousel
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[styles.hCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, style]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.hTop}>
            <Image source={{ uri: doctor.avatar }} style={styles.hAvatar} />
            {doctor.isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.primaryLight }]}>
                <ShieldCheck size={10} color={theme.primary} />
              </View>
            )}
          </View>
          <Text style={[styles.hName, { color: theme.textPrimary }]} numberOfLines={1}>
            {doctor.name}
          </Text>
          <Text style={[styles.hSpec, { color: theme.primary }]} numberOfLines={1}>
            {doctor.specialization}
          </Text>
          <View style={styles.hMeta}>
            <Star size={10} fill="#F59E0B" color="#F59E0B" />
            <Text style={[styles.hMetaText, { color: theme.textPrimary }]}>{doctor.rating}</Text>
            <Text style={[styles.hMetaDot, { color: theme.textMuted }]}>·</Text>
            <Text style={[styles.hMetaText, { color: theme.textSecondary }]}>{doctor.experienceYears}yr</Text>
          </View>
          <View style={styles.hFeeRow}>
            <Text style={[styles.hFee, { color: theme.textSecondary }]}>{doctor.consultationFee}</Text>
            {doctor.consultationDuration && (
              <Text style={[styles.hDuration, { color: theme.textMuted }]}>{doctor.consultationDuration}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: theme.cta }]}
            onPress={onBook || onPress}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Vertical full-width card
  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.vCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.vRow}>
          <Image source={{ uri: doctor.avatar }} style={styles.vAvatar} />
          <View style={styles.vContent}>
            <View style={styles.vNameRow}>
              <Text style={[styles.vName, { color: theme.textPrimary }]} numberOfLines={1}>
                {doctor.name}
              </Text>
              {doctor.isVerified && (
                <ShieldCheck size={14} color={theme.primary} />
              )}
            </View>
            <Text style={[styles.vSpec, { color: theme.primary }]}>{doctor.specialization}</Text>
            <View style={styles.vMetaRow}>
              <View style={styles.vMetaItem}>
                <Star size={11} fill="#F59E0B" color="#F59E0B" />
                <Text style={[styles.vMetaText, { color: theme.textPrimary }]}>{doctor.rating}</Text>
                <Text style={[styles.vMetaSub, { color: theme.textMuted }]}>({doctor.reviewsCount})</Text>
              </View>
              <Text style={[styles.vMetaDot, { color: theme.textMuted }]}>·</Text>
              <Text style={[styles.vMetaText, { color: theme.textSecondary }]}>
                {doctor.experienceYears} yrs exp
              </Text>
            </View>
            <View style={styles.vDetailRow}>
              <Text style={[styles.vFee, { color: theme.textPrimary }]}>{doctor.consultationFee}</Text>
              {doctor.consultationDuration && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                  <View style={styles.vMetaItem}>
                    <Clock size={10} color={theme.textMuted} />
                    <Text style={[styles.vMetaSub, { color: theme.textSecondary }]}>{doctor.consultationDuration}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.bookBtnV, { backgroundColor: theme.cta }]}
            onPress={onBook || onPress}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Horizontal card
  hCard: {
    width: 160,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 3,
    ...SHADOWS.card,
  },
  hTop: {
    position: 'relative',
    marginBottom: 4,
  },
  hAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -3,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  hSpec: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  hMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hMetaDot: {
    fontSize: 11,
  },
  hFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hFee: {
    fontSize: 11,
    fontWeight: '500',
  },
  hDuration: {
    fontSize: 10,
  },
  bookBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Vertical card
  vCard: {
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  vRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  vContent: {
    flex: 1,
    gap: 2,
  },
  vNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  vSpec: {
    fontSize: 12,
    fontWeight: '600',
  },
  vMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  vMetaSub: {
    fontSize: 10,
  },
  vMetaDot: {
    fontSize: 11,
  },
  vDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  vFee: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 12,
  },
  bookBtnV: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
});
