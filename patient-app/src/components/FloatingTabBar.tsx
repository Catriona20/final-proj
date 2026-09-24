import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Search, Calendar, FileText, User } from 'lucide-react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

const TABS = [
  { name: 'HomeTab', label: 'Home', Icon: Home },
  { name: 'SearchTab', label: 'Search', Icon: Search },
  { name: 'AppointmentsTab', label: 'Bookings', Icon: Calendar },
  { name: 'HealthRecordsTab', label: 'Records', Icon: FileText },
  { name: 'ProfileTab', label: 'Profile', Icon: User },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BAR_WIDTH = 440;

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
            borderColor: isDark ? '#1A3560' : '#E2E8F0',
          },
        ]}
      >
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          const route = state.routes[index];
          const { options } = descriptors[route.key];

          const iconAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

          useEffect(() => {
            Animated.spring(iconAnim, {
              toValue: isFocused ? 1 : 0,
              useNativeDriver: true,
              tension: 120,
              friction: 8,
            }).start();
          }, [isFocused]);

          const iconScale = iconAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          });

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              {isFocused && (
                <View
                  style={[
                    styles.activeBackground,
                    { backgroundColor: isDark ? '#0F2557' : '#EBF0FF' },
                  ]}
                />
              )}
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <tab.Icon
                  size={20}
                  color={isFocused ? theme.primary : theme.textMuted}
                  strokeWidth={isFocused ? 2.4 : 1.8}
                />
              </Animated.View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? theme.primary : theme.textMuted,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 20 : SPACING.sm + 2,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MAX_BAR_WIDTH,
    borderRadius: RADIUS.xl,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    ...SHADOWS.float,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    position: 'relative',
    gap: 2,
    minHeight: 46,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    bottom: 0,
    borderRadius: RADIUS.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
  },
});
