import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { RADIUS, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  style,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundMuted,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  style?: object;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }, style]}>
      <View style={styles.row}>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View style={styles.textCol}>
          <SkeletonLoader width="70%" height={14} />
          <SkeletonLoader width="50%" height={12} />
          <SkeletonLoader width="40%" height={10} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={32} borderRadius={RADIUS.sm} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
});
