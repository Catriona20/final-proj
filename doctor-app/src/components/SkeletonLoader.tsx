import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

export const SkeletonLoader: React.FC<{ height?: number; borderRadius?: number; style?: any }> = ({
  height = 80,
  borderRadius = 14,
  style,
}) => {
  const { colors } = useThemeStore();

  return (
    <View
      style={[
        styles.skeleton,
        {
          height,
          borderRadius,
          backgroundColor: colors.cardSubtle,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    width: '100%',
    marginBottom: 12,
    opacity: 0.6,
  },
});
