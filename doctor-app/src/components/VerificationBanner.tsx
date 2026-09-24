import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, ShieldAlert, Clock, ArrowRight } from 'lucide-react-native';
import { DoctorVerificationStatus } from '../types';
import { PALETTE, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface VerificationBannerProps {
  status: DoctorVerificationStatus;
  rejectionReason?: string;
  onPressDetails?: () => void;
  compact?: boolean;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({
  status,
  rejectionReason,
  onPressDetails,
  compact = false,
}) => {
  const { colors, isDark } = useThemeStore();

  if (status === 'VERIFIED' || status === 'ACTIVE') {
    if (compact) {
      return (
        <View style={[styles.compactBadge, { backgroundColor: colors.primary + '15' }]}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={[styles.compactText, { color: colors.primary }]}>Verified Doctor</Text>
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#082046' : '#EFF6FF', borderColor: colors.primary + '30' }]}>
        <View style={styles.contentRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <ShieldCheck size={20} color={colors.primary} />
          </View>
          <View style={styles.textColumn}>
            <View style={styles.statusTitleRow}>
              <Text style={[styles.statusTitle, { color: colors.primary }]}>Verified Doctor Account</Text>
              <View style={[styles.verifiedDot, { backgroundColor: PALETTE.success }]} />
            </View>
            <Text style={[styles.statusSubtitle, { color: colors.secondaryText }]}>
              Medical registration and credentials verified by Council
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (status === 'REJECTED' || (status as string) === 'RESUBMISSION_REQUIRED') {
    return (
      <TouchableOpacity
        onPress={onPressDetails}
        activeOpacity={0.8}
        style={[styles.container, { backgroundColor: PALETTE.errorLight, borderColor: PALETTE.error + '40' }]}
      >
        <View style={styles.contentRow}>
          <View style={[styles.iconCircle, { backgroundColor: PALETTE.error + '20' }]}>
            <ShieldAlert size={20} color={PALETTE.error} />
          </View>
          <View style={styles.textColumn}>
            <Text style={[styles.statusTitle, { color: PALETTE.error }]}>Verification Requires Action</Text>
            <Text style={[styles.statusSubtitle, { color: '#991B1B' }]}>
              {rejectionReason || 'Please resubmit your medical registration certificate.'}
            </Text>
          </View>
          {onPressDetails && <ArrowRight size={18} color={PALETTE.error} />}
        </View>
      </TouchableOpacity>
    );
  }

  // REGISTERED, DOCUMENTS_SUBMITTED, UNDER_REVIEW
  return (
    <TouchableOpacity
      onPress={onPressDetails}
      activeOpacity={0.8}
      style={[styles.container, { backgroundColor: PALETTE.warningLight, borderColor: PALETTE.warning + '40' }]}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconCircle, { backgroundColor: PALETTE.warning + '20' }]}>
          <Clock size={20} color={PALETTE.warning} />
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.statusTitle, { color: '#B45309' }]}>Verification Under Review</Text>
          <Text style={[styles.statusSubtitle, { color: '#92400E' }]}>
            Your professional credentials are being verified by council administrators.
          </Text>
        </View>
        {onPressDetails && <ArrowRight size={18} color="#B45309" />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  verifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusSubtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  compactText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
});
