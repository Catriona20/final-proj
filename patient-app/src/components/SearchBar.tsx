import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { SPACING, RADIUS, SHADOWS, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChangeText,
  onFocus,
  onFilterPress,
  placeholder = 'Search doctors, clinics, specializations...',
  editable = true,
  onPress,
  autoFocus = false,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const Wrapper: any = onPress && !editable ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Search size={18} color={theme.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[
          styles.input,
          { color: theme.textPrimary },
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        editable={editable}
        onFocus={onFocus}
        autoFocus={autoFocus}
      />
      {value.length > 0 && onChangeText && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={theme.textMuted} />
        </TouchableOpacity>
      )}
      {onFilterPress && (
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.primaryLight }]}
          onPress={onFilterPress}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={16} color={theme.primary} />
        </TouchableOpacity>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
    ...SHADOWS.subtle,
  },
  searchIcon: {},
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
