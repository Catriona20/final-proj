import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Stethoscope, HeartPulse, ShieldCheck } from 'lucide-react-native';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 1200 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reveal animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Heartbeat pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8FC" />

      {/* Decorative Glow Orbs */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Brand Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.appName}>MEDLINK</Text>
          <View style={styles.subtitleBadge}>
            <HeartPulse size={13} color={COLORS.primary} />
            <Text style={styles.subtitleBadgeText}>Healthcare Platform</Text>
          </View>
        </View>

        {/* Logo / Pulse Center */}
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconCircle}>
            <Stethoscope size={46} color="#FFFFFF" />
          </View>
          <View style={styles.pulseRing} />
        </Animated.View>

        {/* Tagline */}
        <Text style={styles.tagline}>Connecting you to care...</Text>
      </Animated.View>

      {/* Footer Indicator & Security Badge */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
        <View style={styles.secureRow}>
          <ShieldCheck size={13} color={COLORS.primary} />
          <Text style={styles.versionText}>Patient Mobile Portal • Verified Healthcare Network</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: '10%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(13, 71, 201, 0.08)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: '15%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  content: {
    alignItems: 'center',
    marginTop: 80,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0B1736',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#EBF0FF',
    borderWidth: 1,
    borderColor: '#B8CCFA',
    marginTop: 8,
  },
  subtitleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 25px rgba(13, 71, 201, 0.35)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
      },
    }),
  },
  pulseRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: 'rgba(13, 71, 201, 0.25)',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginTop: 18,
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 12,
  },
  loader: {
    marginBottom: 4,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});


