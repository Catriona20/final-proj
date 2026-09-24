import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { Stethoscope, HeartPulse, ShieldCheck } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 1200 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade & scale reveal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Heartbeat pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND GLOW */}
      <View style={styles.glowCircleLarge} />
      <View style={styles.glowCircleSmall} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* LOGO & PULSE */}
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconBackground}>
            <Stethoscope size={48} color="#FFFFFF" />
          </View>
          <View style={styles.pulseGlow} />
        </Animated.View>

        <Text style={styles.brandTitle}>MEDLINK</Text>

        <View style={styles.subtitleBadge}>
          <HeartPulse size={14} color={PALETTE.accent} />
          <Text style={styles.brandSubtitle}>Healthcare Platform • Doctor Workspace</Text>
        </View>

        <Text style={styles.tagline}>
          Connecting you to care...
        </Text>

        <View style={styles.footerRow}>
          <ShieldCheck size={14} color={PALETTE.secondary} />
          <Text style={styles.footerText}>Clinical Intelligence Platform • Verified Doctor Network</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  glowCircleLarge: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: PALETTE.secondary + '20',
    top: '20%',
  },
  glowCircleSmall: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: PALETTE.accent + '15',
    bottom: '25%',
  },
  content: {
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  pulseGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: PALETTE.accent + '60',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: TYPOGRAPHY.weights.extraBold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#0C2347',
    borderWidth: 1,
    borderColor: '#1E3A6B',
    marginTop: 8,
    marginBottom: 16,
  },
  brandSubtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: PALETTE.accent,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: PALETTE.secondaryTextDark,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 36,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    color: PALETTE.secondaryTextDark,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
