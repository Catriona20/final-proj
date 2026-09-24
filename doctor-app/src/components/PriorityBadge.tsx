import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, Zap } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY } from '../constants/theme';

interface PriorityBadgeProps {
  priority?: 'STANDARD' | 'URGENT' | 'EMERGENCY' | string;
  reason?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority = 'STANDARD', reason }) => {
  const isEmergency = priority === 'EMERGENCY' || (reason && reason.toLowerCase().includes('emergency'));
  const isUrgent = priority === 'URGENT' || (reason && reason.toLowerCase().includes('urgent'));

  if (!isEmergency && !isUrgent) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isEmergency ? PALETTE.emergencyBg : PALETTE.warningLight,
          borderColor: isEmergency ? PALETTE.emergency + '40' : PALETTE.warning + '40',
        },
      ]}
    >
      {isEmergency ? (
        <AlertCircle size={14} color={PALETTE.emergency} />
      ) : (
        <Zap size={14} color={PALETTE.warning} />
      )}
      <Text
        style={[
          styles.text,
          { color: isEmergency ? PALETTE.emergency : '#B45309' },
        ]}
      >
        {isEmergency ? 'HIGH PRIORITY • EMERGENCY' : 'PRIORITY PATIENT'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.2,
  },
});
