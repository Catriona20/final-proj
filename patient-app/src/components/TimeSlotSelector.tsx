import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sun, Sunset, Moon } from 'lucide-react-native';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

export interface TimeSlot {
  time: string;
  isAvailable?: boolean;
  status?: 'Available' | 'Limited' | 'Unavailable' | 'Recommended';
  reasoning?: string;
}

export interface GroupedSlots {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
}

interface TimeSlotSelectorProps {
  slots: GroupedSlots;
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedTime,
  onSelectTime,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const renderSlotGroup = (
    title: string,
    Icon: any,
    items: TimeSlot[],
    subtitle?: string
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <Icon size={14} color={theme.primary} />
          <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.groupSubtitle, { color: theme.textMuted }]}>
              · {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.slotsGrid}>
          {items.map((slot) => {
            const isSelected = selectedTime === slot.time;
            const isAvailable = slot.isAvailable !== false && slot.status !== 'Unavailable';

            return (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.slotBtn,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : isAvailable
                      ? isDark
                        ? '#0C2347'
                        : '#FFFFFF'
                      : isDark
                      ? '#06152F'
                      : '#F1F5F9',
                    borderColor: isSelected
                      ? theme.primary
                      : isAvailable
                      ? theme.cardBorder
                      : 'transparent',
                    borderWidth: isSelected ? 2 : 1,
                    opacity: isAvailable ? 1 : 0.45,
                  },
                ]}
                disabled={!isAvailable}
                onPress={() => onSelectTime(slot.time)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.slotText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isAvailable
                        ? theme.textPrimary
                        : theme.textMuted,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const allSlots = [...(slots.morning || []), ...(slots.afternoon || []), ...(slots.evening || [])];
  const hasAvailable = allSlots.some((s) => s.isAvailable !== false && s.status !== 'Unavailable');

  return (
    <View style={styles.container}>
      {(!allSlots.length || !hasAvailable) && (
        <View
          style={[
            styles.emptyContainer,
            {
              backgroundColor: isDark ? '#081A36' : '#F8FAFC',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
            No confirmed doctor availability for this date.
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Doctor availability has not yet been confirmed by the clinic for this date. Please check back once availability is approved or select another date.
          </Text>
        </View>
      )}
      {renderSlotGroup('Morning', Sun, slots.morning, '09:00 AM – 12:00 PM')}
      {renderSlotGroup('Afternoon', Sunset, slots.afternoon, '02:00 PM – 05:00 PM')}
      {renderSlotGroup('Evening', Moon, slots.evening, '06:00 PM – 08:30 PM')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  groupContainer: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  groupSubtitle: {
    fontSize: 11,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    minWidth: 88,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  slotText: {
    fontSize: 12,
  },
});
