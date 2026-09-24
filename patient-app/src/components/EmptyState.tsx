import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SearchX, MapPinOff, FilterX } from 'lucide-react-native';
import { SPACING, RADIUS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: 'search' | 'location' | 'filter';
  actions?: { label: string; onPress: () => void; primary?: boolean }[];
  style?: object;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = 'search',
  actions,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const IconComponent = icon === 'search' ? SearchX : icon === 'location' ? MapPinOff : FilterX;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <IconComponent size={28} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      )}
      {actions && actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: action.primary ? theme.cta : theme.card,
                  borderColor: action.primary ? theme.cta : theme.cardBorder,
                  borderWidth: action.primary ? 0 : 1,
                },
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: action.primary ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
  },
  message: {
    ...TYPOGRAPHY.bodySm,
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
