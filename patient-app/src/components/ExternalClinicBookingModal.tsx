import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import {
  Building2,
  Navigation,
  Phone,
  Clock,
  MapPin,
  X,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react-native';
import { Clinic } from '../types';
import { SPACING, RADIUS, SHADOWS, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface ExternalClinicBookingModalProps {
  visible: boolean;
  onClose: () => void;
  clinic: Clinic | null;
  department?: string;
  onViewClinic?: () => void;
}

export const ExternalClinicBookingModal: React.FC<ExternalClinicBookingModalProps> = ({
  visible,
  onClose,
  clinic,
  department,
  onViewClinic,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  if (!clinic) return null;

  const handleOpenDirections = () => {
    const lat = clinic.latitude || 13.0827;
    const lng = clinic.longitude || 80.2707;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (clinic.googlePlaceId) {
      url += `&destination_place_id=${clinic.googlePlaceId}`;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation Error', 'Could not open map navigation.');
    });
  };

  const handleCallClinic = () => {
    const rawPhone = clinic.phone || '+91 44 2811 0000';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Phone Call', `Please call ${rawPhone} directly.`);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#081B38' : '#FFFFFF',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.primaryLight }]}>
              <Building2 size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                {clinic.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {clinic.category} · {clinic.distance || 'Chennai Metro'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.backgroundSoft }]}
              onPress={onClose}
            >
              <X size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Directory Notice Box */}
          <View
            style={[
              styles.noticeBox,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(2, 132, 199, 0.2)',
              },
            ]}
          >
            <View style={styles.noticeHeader}>
              <ShieldAlert size={15} color={theme.primary} />
              <Text style={[styles.noticeTitle, { color: theme.primary }]}>
                Healthcare Directory Listing
              </Text>
            </View>
            <Text style={[styles.noticeDesc, { color: theme.textSecondary }]}>
              This clinic is listed in our Chennai healthcare directory. Online token booking is not currently integrated with MedLink for this facility, but walk-in OPD consultations and physical visits are available.
            </Text>
          </View>

          {/* Clinic Information Snippets */}
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Clock size={14} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                Hours: <Text style={{ fontWeight: '600' }}>{clinic.openHours || '08:30 AM – 08:30 PM'}</Text>
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={14} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]} numberOfLines={2}>
                {clinic.address}
              </Text>
            </View>

            {clinic.phone && (
              <View style={styles.infoRow}>
                <Phone size={14} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                  {clinic.phone}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsCol}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                onClose();
                handleOpenDirections();
              }}
              activeOpacity={0.88}
            >
              <Navigation size={15} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>Get Directions to Clinic</Text>
            </TouchableOpacity>

            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: theme.backgroundSoft,
                    borderColor: theme.cardBorder,
                  },
                ]}
                onPress={handleCallClinic}
                activeOpacity={0.85}
              >
                <Phone size={14} color={theme.primary} />
                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                  Call Clinic
                </Text>
              </TouchableOpacity>

              {onViewClinic && (
                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    onViewClinic();
                  }}
                  activeOpacity={0.85}
                >
                  <Building2 size={14} color={theme.primary} />
                  <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                    View Profile
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.card,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 4,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  infoCol: {
    gap: 8,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  actionsCol: {
    gap: 8,
    marginTop: 4,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    ...SHADOWS.subtle,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
