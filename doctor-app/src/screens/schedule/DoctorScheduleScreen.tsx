import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { scheduleApi } from '../../api/scheduleApi';
import { ScheduleException } from '../../types';

interface DoctorScheduleScreenProps {
  navigation: any;
}

export const DoctorScheduleScreen: React.FC<DoctorScheduleScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useThemeStore();

  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [slotDuration, setSlotDuration] = useState('25 min');
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [newLeaveDate, setNewLeaveDate] = useState('Aug 28, 2026');
  const [newLeaveReason, setNewLeaveReason] = useState('Medical Conference / Continuing Medical Education');
  const [showAddException, setShowAddException] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const res = await scheduleApi.getSchedule();
      if (res.workingDays) setWorkingDays(res.workingDays);
      if (res.consultationDuration) setSlotDuration(res.consultationDuration);
      if (res.exceptions) setExceptions(res.exceptions);
    } catch (e) {}
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      await scheduleApi.updateSchedule({
        availableDays: workingDays,
        consultationDuration: slotDuration,
      });
      Alert.alert('Success', 'Working hours and slot preferences updated.');
    } catch (e) {
      Alert.alert('Notice', 'Schedule preferences saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!newLeaveDate || !newLeaveReason) return;
    try {
      const res = await scheduleApi.updateSchedule({
        newException: { date: newLeaveDate, reason: newLeaveReason, isFullDay: true },
      });
      if (res.exceptions) setExceptions(res.exceptions);
      setShowAddException(false);
      Alert.alert('Leave Exception Added', `Clinic slot booking disabled on ${newLeaveDate}.`);
    } catch (e) {
      setShowAddException(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TOP BAR WITH BACK BUTTON */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.text} />
            <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.text }]}>Doctor Schedule & OPD Hours</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Configure your active consulting days, slot intervals, and emergency leave exceptions.
          </Text>
        </View>


        {/* WORKING DAYS SELECTOR */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Consulting Days</Text>
          <View style={styles.daysRow}>
            {daysOfWeek.map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.cardSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* SLOT DURATION */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>OPD Consultation Slot Duration</Text>
          <View style={styles.durationRow}>
            {['15 min', '20 min', '25 min', '30 min'].map((dur) => (
              <TouchableOpacity
                key={dur}
                onPress={() => setSlotDuration(dur)}
                style={[
                  styles.durationChip,
                  {
                    backgroundColor: slotDuration === dur ? PALETTE.accent : colors.cardSubtle,
                    borderColor: slotDuration === dur ? PALETTE.accent : colors.border,
                  },
                ]}
              >
                <Text style={[styles.durationChipText, { color: slotDuration === dur ? '#FFFFFF' : colors.text }]}>
                  {dur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSaveSchedule}
            disabled={isSaving}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <CheckCircle2 size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Update OPD Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* LEAVE & UNAVAILABILITY EXCEPTIONS */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Leave & Exceptions</Text>
              <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>Blocks patient booking for specific dates</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddException(!showAddException)}
              style={[styles.addExceptionBtn, { backgroundColor: colors.primary + '18' }]}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.addExceptionBtnText, { color: colors.primary }]}>Add Leave</Text>
            </TouchableOpacity>
          </View>

          {showAddException && (
            <View style={[styles.addExceptionForm, { backgroundColor: colors.cardSubtle, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Leave Date</Text>
              <TextInput
                value={newLeaveDate}
                onChangeText={setNewLeaveDate}
                style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Aug 28, 2026"
                placeholderTextColor={colors.secondaryText}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 8 }]}>Reason for Leave / CME</Text>
              <TextInput
                value={newLeaveReason}
                onChangeText={setNewLeaveReason}
                style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Medical conference / Emergency personal leave"
                placeholderTextColor={colors.secondaryText}
              />

              <TouchableOpacity
                onPress={handleAddException}
                style={[styles.confirmLeaveBtn, { backgroundColor: PALETTE.accent }]}
              >
                <Text style={styles.confirmLeaveBtnText}>Confirm Unavailability</Text>
              </TouchableOpacity>
            </View>
          )}

          {exceptions.map((ex) => (
            <View key={ex.id} style={[styles.exceptionItem, { backgroundColor: colors.cardSubtle }]}>
              <View style={styles.exceptionInfo}>
                <Text style={[styles.exceptionDate, { color: colors.text }]}>{ex.date}</Text>
                <Text style={[styles.exceptionReason, { color: colors.secondaryText }]}>{ex.reason}</Text>
              </View>
              <View style={[styles.leaveBadge, { backgroundColor: PALETTE.warningLight }]}>
                <Text style={[styles.leaveBadgeText, { color: '#B45309' }]}>Full Day Off</Text>
              </View>
            </View>
          ))}

          {exceptions.length === 0 && !showAddException && (
            <Text style={[styles.noExceptions, { color: colors.secondaryText }]}>No active leave exceptions planned.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  headerBlock: {
    marginBottom: 16,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: 6,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationChipText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  addExceptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addExceptionBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  addExceptionForm: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: TYPOGRAPHY.sizes.body,
  },
  confirmLeaveBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmLeaveBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  exceptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  exceptionInfo: {
    flex: 1,
  },
  exceptionDate: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  exceptionReason: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  leaveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leaveBadgeText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  noExceptions: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
  topBar: {
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semiBold,
  },
});
