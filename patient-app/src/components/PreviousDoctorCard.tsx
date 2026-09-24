import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Sparkles, Star, ShieldCheck, Clock, Check } from 'lucide-react-native';
import { Doctor } from '../types';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface PreviousDoctorCardProps {
  doctor: Doctor;
  isSelected?: boolean;
  onSelect: () => void;
}

export const PreviousDoctorCard: React.FC<PreviousDoctorCardProps> = ({
  doctor,
  isSelected = false,
  onSelect,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? isDark
              ? '#0F2557'
              : '#EBF0FF'
            : isDark
            ? '#0C2347'
            : '#FFFFFF',
          borderColor: isSelected ? theme.primary : '#38BDF8',
          borderWidth: isSelected ? 2 : 1.5,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.88}
    >
      {/* Top Banner Tag */}
      <View style={[styles.banner, { backgroundColor: isDark ? '#172554' : '#E0F2FE' }]}>
        <Sparkles size={12} color="#0284C7" />
        <Text style={[styles.bannerText, { color: '#0284C7' }]}>
          Recommended · You previously consulted with this doctor
        </Text>
      </View>

      {/* Doctor Content */}
      <View style={styles.body}>
        <Image source={{ uri: doctor.avatar }} style={styles.avatar} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
              {doctor.name}
            </Text>
            {doctor.isVerified && <ShieldCheck size={14} color={theme.primary} />}
          </View>
          <Text style={[styles.spec, { color: theme.primary }]}>{doctor.specialization}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Star size={11} fill="#F59E0B" color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.textPrimary }]}>{doctor.rating}</Text>
            </View>
            <Text style={[styles.dot, { color: theme.textMuted }]}>·</Text>
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {doctor.previousVisitsCount || 1} previous visit{doctor.previousVisitsCount === 1 ? '' : 's'}
            </Text>
            {doctor.lastVisitedDate && (
              <>
                <Text style={[styles.dot, { color: theme.textMuted }]}>·</Text>
                <Text style={[styles.metaText, { color: theme.textMuted }]}>
                  Last: {doctor.lastVisitedDate}
                </Text>
              </>
            )}
          </View>

          <View style={styles.feeRow}>
            <Text style={[styles.feeText, { color: theme.textPrimary }]}>{doctor.consultationFee}</Text>
            <Text style={[styles.durationText, { color: theme.textMuted }]}>
              / {doctor.consultationDuration || '25 min'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.selectBtn,
            {
              backgroundColor: isSelected ? theme.primary : theme.cta,
            },
          ]}
          onPress={onSelect}
        >
          {isSelected ? (
            <Check size={14} color="#FFFFFF" />
          ) : (
            <Text style={styles.selectBtnText}>Select</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  bannerText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  spec: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    fontSize: 11,
  },
  metaText: {
    fontSize: 11,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  feeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  durationText: {
    fontSize: 11,
  },
  selectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
