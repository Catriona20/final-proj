import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import {
  Settings,
  ChevronRight,
  Heart,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
  Star,
  Shield,
  Phone,
  Sparkles,
  MapPin,
  Moon,
  Sun,
  Laptop,
  Bot,
  AlertTriangle,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { useThemeStore, ThemeMode } from '../../store/useThemeStore';
import { MOCK_PATIENT } from '../../data/mockData';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { LocationSelectorModal } from '../../components/LocationSelectorModal';
import { MedLinkAssistantModal } from '../../components/MedLinkAssistantModal';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const { activeLocation } = useAppStore();
  const { themeMode, isDark, setThemeMode } = useThemeStore();
  const theme = getThemeColors(isDark);

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  const profile = user ?? MOCK_PATIENT;

  const preferredSpecialization = profile.preferredSpecialization || 'General Physician';
  const preferredDoctor = profile.preferredDoctor || 'Dr. Aris Thorne';
  const notificationsEnabled = profile.notificationsEnabled ?? true;

  const SPECIALIZATION_CYCLE = [
    'General Physician',
    'Cardiologist',
    'Dermatologist',
    'Ophthalmologist',
  ];
  const DOCTOR_CYCLE = [
    'Dr. Aris Thorne',
    'Dr. Elena Vance',
    'Dr. Marcus Chen',
    'Dr. Priya Sharma',
  ];

  const cycleSpecialization = () => {
    const nextIdx =
      (SPECIALIZATION_CYCLE.indexOf(preferredSpecialization) + 1) % SPECIALIZATION_CYCLE.length;
    updateProfile({ preferredSpecialization: SPECIALIZATION_CYCLE[nextIdx] });
    Alert.alert(
      'Preference Updated',
      `Preferred specialization set to: ${SPECIALIZATION_CYCLE[nextIdx]}`
    );
  };

  const cycleDoctor = () => {
    const nextIdx = (DOCTOR_CYCLE.indexOf(preferredDoctor) + 1) % DOCTOR_CYCLE.length;
    updateProfile({ preferredDoctor: DOCTOR_CYCLE[nextIdx] });
    Alert.alert('Preference Updated', `Preferred doctor set to: ${DOCTOR_CYCLE[nextIdx]}`);
  };

  const toggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    updateProfile({ notificationsEnabled: nextVal });
    Alert.alert(
      'Notifications',
      nextVal ? 'Appointment push alerts enabled' : 'Push alerts disabled'
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* HERO CARD */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#0F172A' : '#0B1530' }]}>
          <View style={styles.heroBlob} />

          <View style={styles.avatarContainer}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          </View>

          <Text style={styles.heroName}>{profile.name}</Text>
          <Text style={styles.heroEmail}>{profile.email}</Text>
          <Text style={styles.heroPhone}>{profile.phone}</Text>
        </View>

        {/* VITALS ROW */}
        <View
          style={[styles.vitalsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        >
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalValue, { color: theme.textPrimary }]}>{profile.age || '--'}</Text>
            <Text style={[styles.vitalLabel, { color: theme.textMuted }]}>Age</Text>
          </View>
          <View style={[styles.vitalDivider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalValue, { color: theme.textPrimary }]}>
              {profile.bloodGroup || '--'}
            </Text>
            <Text style={[styles.vitalLabel, { color: theme.textMuted }]}>Blood Group</Text>
          </View>
          <View style={[styles.vitalDivider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.vitalItem}>
            <Text style={[styles.vitalValue, { color: theme.textPrimary }]}>{profile.gender || '--'}</Text>
            <Text style={[styles.vitalLabel, { color: theme.textMuted }]}>Gender</Text>
          </View>
        </View>

        {/* APPEARANCE / THEME SELECTOR (Light, Dark, System) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>APPEARANCE</Text>
          <View
            style={[styles.themeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <Text style={[styles.themeCardLabel, { color: theme.textPrimary }]}>App Theme Mode</Text>
            <View style={styles.themeOptionsRow}>
              {(
                [
                  { key: 'light', label: 'Light', icon: Sun },
                  { key: 'dark', label: 'Dark', icon: Moon },
                  { key: 'system', label: 'System', icon: Laptop },
                ] as { key: ThemeMode; label: string; icon: any }[]
              ).map((opt) => {
                const isSelected = themeMode === opt.key;
                const IconComp = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.themeOptionBtn,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.backgroundSoft,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => setThemeMode(opt.key)}
                  >
                    <IconComp size={16} color={isSelected ? theme.primary : theme.textSecondary} />
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color: isSelected ? theme.primary : theme.textSecondary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* LOCATION & HEALTH PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>LOCATION & PREFERENCES</Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsLocationModalVisible(true)}
            >
              <View style={[styles.menuIconBox, { backgroundColor: theme.primaryLight }]}>
                <MapPin size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>Active Search Location</Text>
                <Text style={[styles.menuValue, { color: theme.primary, fontWeight: '700' }]}>
                  {activeLocation.locality || activeLocation.name}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity style={styles.menuItem} onPress={cycleSpecialization}>
              <View style={[styles.menuIconBox, { backgroundColor: theme.accentLight }]}>
                <Sparkles size={18} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
                  Preferred Specialization
                </Text>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>
                  {preferredSpecialization}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity style={styles.menuItem} onPress={cycleDoctor}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Star size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>Preferred Doctor</Text>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>{preferredDoctor}</Text>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* EMERGENCY PREFERENCES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>EMERGENCY & SAFETY</Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Phone size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>Emergency Contact</Text>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>
                  {profile.emergencyContact || '+91 98409 87654 (Spouse)'}
                </Text>
              </View>
            </View>

            <View style={[styles.itemDivider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsChatbotVisible(true)}
            >
              <View style={[styles.menuIconBox, { backgroundColor: theme.primaryLight }]}>
                <Bot size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>MedLink Assistant</Text>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>
                  Instant rule-based healthcare guidance
                </Text>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT & NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT</Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={toggleNotifications}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Bell size={18} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.menuValue, { color: theme.textMuted }]}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <View style={[styles.menuIconBox, { backgroundColor: theme.errorLight }]}>
                <LogOut size={18} color={theme.error} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.error, fontWeight: '700' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* LOCATION SELECTION MODAL */}
      <LocationSelectorModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
      />

      {/* MEDLINK ASSISTANT MODAL */}
      <MedLinkAssistantModal
        visible={isChatbotVisible}
        onClose={() => setIsChatbotVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    gap: SPACING.md,
  },
  heroCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  heroBlob: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#38BDF8',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroPhone: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  vitalsCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  vitalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  vitalLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalDivider: {
    width: 1,
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  themeCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.subtle,
  },
  themeCardLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuValue: {
    fontSize: 11,
    marginTop: 1,
  },
  itemDivider: {
    height: 1,
    marginLeft: 56,
  },
});
