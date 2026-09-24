import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Calendar, Clock, ChevronRight, PlusCircle, Activity } from 'lucide-react-native';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { Appointment, AppStackParamList } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAppointmentStore } from '../../store/useAppointmentStore';
import { useThemeStore } from '../../store/useThemeStore';
import { timeUtils } from '../../utils/timeUtils';

type TabType = 'today' | 'upcoming' | 'completed' | 'cancelled' | 'noshow';
type AppointmentsScreenNavProp = StackNavigationProp<AppStackParamList, 'MainTabs'>;

export const AppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<AppointmentsScreenNavProp>();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const { appointments } = useAppointmentStore();

  const todayIso = timeUtils.getTodayDateString();

  const isAppointmentToday = (a: Appointment) => {
    const rawDate = a.date || (a as any).appointmentDate || '';
    const aptDate = rawDate.slice(0, 10);
    return aptDate === todayIso || (rawDate.toLowerCase().includes('today') && !rawDate.toLowerCase().includes('yesterday')) || (a as any).isToday === true;
  };

  const todayAppointments = appointments.filter((a) => {
    const isTerminated = ['Completed', 'COMPLETED', 'Cancelled', 'CANCELLED', 'No Show', 'NO_SHOW', 'No-Show'].includes(a.status);
    return !isTerminated && isAppointmentToday(a);
  });

  const upcomingAppointments = appointments.filter((a) => {
    const isTerminated = ['Completed', 'COMPLETED', 'Cancelled', 'CANCELLED', 'No Show', 'NO_SHOW', 'No-Show'].includes(a.status);
    return !isTerminated && !isAppointmentToday(a);
  });

  const completedAppointments = appointments.filter((a) =>
    ['Completed', 'COMPLETED'].includes(a.status)
  );

  const cancelledAppointments = appointments.filter((a) =>
    ['Cancelled', 'CANCELLED'].includes(a.status)
  );

  const noShowAppointments = appointments.filter((a) =>
    ['No Show', 'NO_SHOW', 'No-Show'].includes(a.status)
  );

  const displayed =
    activeTab === 'today'
      ? todayAppointments
      : activeTab === 'upcoming'
      ? upcomingAppointments
      : activeTab === 'completed'
      ? completedAppointments
      : activeTab === 'cancelled'
      ? cancelledAppointments
      : noShowAppointments;

  const totalActiveCount = todayAppointments.length + upcomingAppointments.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header Bar with Persistent Theme Toggle */}
      <View style={[styles.header, { backgroundColor: isDark ? '#06152F' : '#FFFFFF', borderBottomColor: theme.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>My Appointments</Text>
          <Text style={[styles.subTitle, { color: theme.textMuted }]}>
            {todayAppointments.length} today · {upcomingAppointments.length} upcoming
          </Text>
        </View>

        <View style={styles.headerRight}>
          <ThemeToggle compact />

          <TouchableOpacity
            style={[styles.bookNewBtn, { backgroundColor: theme.cta }]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('SelectDepartment')}
          >
            <PlusCircle size={14} color="#FFFFFF" />
            <Text style={styles.bookNewText}>Book Visit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Filter Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.cardBorder, backgroundColor: isDark ? '#06152F' : '#FFFFFF' }]}>
        {[
          { key: 'today', label: `Today (${todayAppointments.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingAppointments.length})` },
          { key: 'completed', label: `Completed (${completedAppointments.length})` },
          { key: 'cancelled', label: `Cancelled (${cancelledAppointments.length})` },
          { key: 'noshow', label: `No-show (${noShowAppointments.length})` },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                isActive && [styles.tabItemActive, { borderBottomColor: theme.primary }],
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.primary : theme.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {displayed.length === 0 ? (
          <EmptyState
            icon="search"
            title={`No ${activeTab} appointments`}
            message={
              activeTab === 'upcoming'
                ? 'Select a department to discover clinics and schedule your OPD visit.'
                : 'Your consultation history will appear here once visits are completed.'
            }
            actions={
              activeTab === 'upcoming'
                ? [
                    {
                      label: 'Book Consultation',
                      onPress: () => navigation.navigate('SelectDepartment'),
                      primary: true,
                    },
                  ]
                : undefined
            }
          />
        ) : (
          <View style={styles.list}>
            {displayed.map((appt) => {
              const isWaiting = ['Waiting', 'Almost Your Turn', 'Next', 'Confirmed', 'Booked'].includes(appt.status);

              return (
                <TouchableOpacity
                  key={appt.id}
                  style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appt.id })}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.docName, { color: theme.textPrimary }]}>{appt.doctorName}</Text>
                      <Text style={[styles.docSpec, { color: theme.primary }]}>
                        {appt.doctorSpecialization} {appt.department ? `· ${appt.department}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.tokenBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.tokenText, { color: theme.primary }]}>
                        {appt.tokenNumber || '#04'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.clinicName, { color: theme.textSecondary }]} numberOfLines={1}>
                    🏥 {appt.clinicName}
                  </Text>

                  <View
                    style={[
                      styles.metricsRow,
                      { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder },
                    ]}
                  >
                    <Text style={[styles.metricText, { color: theme.textPrimary }]}>
                      📅 {timeUtils.formatRelativeDate(appt.date)} · ⏰ {appt.time}
                    </Text>
                    {isWaiting && appt.patientsAhead !== undefined && (
                      <Text style={[styles.metricText, { color: theme.cta, fontWeight: '700' }]}>
                        {appt.patientsAhead} patients ahead
                      </Text>
                    )}
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              appt.status === 'Completed'
                                ? theme.success
                                : appt.status === 'Cancelled'
                                ? theme.error
                                : theme.primary,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              appt.status === 'Completed'
                                ? theme.success
                                : appt.status === 'Cancelled'
                                ? theme.error
                                : theme.primary,
                          },
                        ]}
                      >
                        {appt.status}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[styles.viewDetailsText, { color: theme.primary }]}>Live Queue</Text>
                      <ChevronRight size={14} color={theme.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    ...SHADOWS.subtle,
  },
  bookNewText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 12,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  list: {
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 8,
    ...SHADOWS.subtle,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
  },
  docSpec: {
    fontSize: 11,
    fontWeight: '600',
  },
  tokenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clinicName: {
    fontSize: 11,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  metricText: {
    fontSize: 11,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
