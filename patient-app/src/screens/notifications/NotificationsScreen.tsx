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
import {
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  Megaphone,
  CheckCheck,
  Trash2,
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { AppStackParamList, NotificationCategory, NotificationItem } from '../../types';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';

type NotifNavProp = StackNavigationProp<AppStackParamList>;

const CATEGORIES: Array<NotificationCategory | 'All'> = [
  'All',
  'Appointments',
  'Queue Updates',
  'Clinic Updates',
  'Reminders',
  'System',
  'Announcements',
];

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotifNavProp>();
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const {
    notifications,
    unreadCount,
    selectedCategory,
    setSelectedCategory,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearNotification,
  } = useNotificationStore();

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'Appointments':
        return <Calendar size={16} color={theme.primary} />;
      case 'Queue Updates':
        return <Clock size={16} color="#F59E0B" />;
      case 'Clinic Updates':
        return <Info size={16} color="#3B82F6" />;
      case 'Announcements':
        return <Megaphone size={16} color="#EC4899" />;
      case 'Reminders':
        return <Bell size={16} color="#8B5CF6" />;
      case 'System':
      default:
        return <CheckCircle size={16} color={theme.success} />;
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.actionData?.appointmentId) {
      navigation.navigate('AppointmentDetail', { appointmentId: item.actionData.appointmentId });
    } else if (item.actionData?.clinicId) {
      navigation.navigate('ClinicDetail', { clinicId: item.actionData.clinicId });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.backgroundSoft, borderColor: theme.cardBorder }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ArrowLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notification Center</Text>
            <Text style={[styles.headerSub, { color: theme.textMuted }]}>
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primaryLight }]}
              onPress={markAllAsRead}
            >
              <CheckCheck size={14} color={theme.primary} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>Read All</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.errorLight }]}
              onPress={clearAll}
            >
              <Trash2 size={14} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORY TABS HORIZONTAL SCROLL */}
      <View style={[styles.categoriesBar, { borderBottomColor: theme.cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* NOTIFICATION LIST */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={[styles.emptyStateCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Bell size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
              {selectedCategory === 'All'
                ? 'You have no alerts at this time.'
                : `No notifications under "${selectedCategory}".`}
            </Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: item.read ? theme.card : isDark ? '#111E3D' : '#F0F7FF',
                    borderColor: item.read ? theme.cardBorder : theme.primary,
                  },
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.88}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.backgroundSoft }]}>
                  {getCategoryIcon(item.category)}
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.notifTopRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{item.category}</Text>
                    </View>
                    <Text style={[styles.timestampText, { color: theme.textMuted }]}>{item.timestamp}</Text>
                  </View>

                  <Text
                    style={[
                      styles.notifTitle,
                      { color: theme.textPrimary, fontWeight: item.read ? '600' : '800' },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>{item.message}</Text>
                </View>

                {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.cta }]} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
  },
  headerSub: {
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesBar: {
    borderBottomWidth: 1,
    paddingVertical: SPACING.sm,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs + 2,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  notifList: {
    gap: SPACING.sm + 2,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    ...SHADOWS.subtle,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timestampText: {
    fontSize: 10,
  },
  notifTitle: {
    fontSize: 13,
  },
  notifMessage: {
    fontSize: 11,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'center',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.labelLg,
    marginTop: SPACING.xs,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});
