import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Clock, X, AlertTriangle, Send } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { useDoctorAppStore } from '../store/useDoctorAppStore';

interface DelayModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DelayModal: React.FC<DelayModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeStore();
  const { reportDelay } = useDoctorAppStore();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('20');
  const [reason, setReason] = useState('Emergency clinical procedure');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const presetOptions = [10, 15, 30, 45];

  const handleBroadcastDelay = async () => {
    const minutes = isCustom ? parseInt(customMinutes, 10) || 15 : selectedMinutes;
    setIsSubmitting(true);
    const success = await reportDelay(minutes, reason);
    setIsSubmitting(false);

    if (success) {
      setSuccessMsg(`Broadcast sent! Patients notified of ~${minutes} min delay.`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }, SHADOWS.medium]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AlertTriangle size={22} color={PALETTE.warning} />
              <Text style={[styles.title, { color: colors.text }]}>Report Doctor Delay</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: colors.secondaryText }]}>
            Running late due to an emergency or procedure? Select the delay duration to recalculate patient ETAs and broadcast real-time notifications.
          </Text>

          {/* PRESET CHIPS */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>Select Delay Duration:</Text>
          <View style={styles.presetsRow}>
            {presetOptions.map((mins) => {
              const isSelected = !isCustom && selectedMinutes === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  onPress={() => {
                    setSelectedMinutes(mins);
                    setIsCustom(false);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? PALETTE.warning : colors.cardSubtle,
                      borderColor: isSelected ? PALETTE.warning : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Clock size={14} color={isSelected ? '#FFFFFF' : colors.text} />
                  <Text
                    style={[
                      styles.presetText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    +{mins} min
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setIsCustom(true)}
              style={[
                styles.presetChip,
                {
                  backgroundColor: isCustom ? PALETTE.warning : colors.cardSubtle,
                  borderColor: isCustom ? PALETTE.warning : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: isCustom ? '#FFFFFF' : colors.text },
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {isCustom && (
            <View style={styles.customInputRow}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Enter custom minutes:</Text>
              <TextInput
                value={customMinutes}
                onChangeText={setCustomMinutes}
                keyboardType="numeric"
                style={[
                  styles.customInput,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="20"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
          )}

          {/* REASON */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Advisory Reason (Sent to Patients):</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            style={[
              styles.reasonInput,
              { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="e.g. Critical procedure in minor OT"
            placeholderTextColor={colors.secondaryText}
          />

          {successMsg && (
            <View style={[styles.successBanner, { backgroundColor: PALETTE.successLight }]}>
              <Text style={[styles.successBannerText, { color: PALETTE.success }]}>{successMsg}</Text>
            </View>
          )}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            onPress={handleBroadcastDelay}
            disabled={isSubmitting}
            style={[styles.broadcastBtn, { backgroundColor: PALETTE.accent }]}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.broadcastBtnText}>Broadcast Delay Advisory</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.body,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  customInputRow: {
    marginBottom: 10,
  },
  customInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 4,
  },
  reasonInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    marginBottom: 16,
  },
  successBanner: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  successBannerText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
