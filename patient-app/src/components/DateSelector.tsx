import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

export interface DayOption {
  dateString: string;
  dayName: string;
  dayNum: number;
  month: string;
  display: string;
}

interface DateSelectorProps {
  days: DayOption[];
  selectedDate: string;
  onSelectDate: (dateString: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {days.map((day) => {
        const isSelected = selectedDate === day.dateString || selectedDate === day.display;

        return (
          <TouchableOpacity
            key={day.dateString}
            style={[
              styles.dateCard,
              {
                backgroundColor: isSelected
                  ? theme.primary
                  : isDark
                  ? '#0C2347'
                  : '#FFFFFF',
                borderColor: isSelected ? theme.primary : theme.cardBorder,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => onSelectDate(day.dateString)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.dayName,
                { color: isSelected ? '#BFDBFE' : theme.textMuted },
              ]}
            >
              {day.dayName.toUpperCase()}
            </Text>
            <Text
              style={[
                styles.dayNum,
                { color: isSelected ? '#FFFFFF' : theme.textPrimary },
              ]}
            >
              {day.dayNum}
            </Text>
            <Text
              style={[
                styles.month,
                { color: isSelected ? '#FFFFFF' : theme.textSecondary },
              ]}
            >
              {day.month}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...SHADOWS.card,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  month: {
    fontSize: 11,
    fontWeight: '600',
  },
});
