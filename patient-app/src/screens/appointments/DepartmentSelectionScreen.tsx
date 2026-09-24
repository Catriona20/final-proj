import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, Search, MapPin, Sparkles, ChevronRight, X } from 'lucide-react-native';
import { AppStackParamList, Department } from '../../types';
import { MOCK_DEPARTMENTS } from '../../data/mockData';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAppStore } from '../../store/useAppStore';
import { DepartmentCard } from '../../components/DepartmentCard';
import { ThemeToggle } from '../../components/ThemeToggle';

type DeptNavProp = StackNavigationProp<AppStackParamList, 'SelectDepartment'>;

export const DepartmentSelectionScreen: React.FC = () => {
  const navigation = useNavigation<DeptNavProp>();
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);
  const { activeLocation } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(MOCK_DEPARTMENTS[0].id);

  const filteredDepts = MOCK_DEPARTMENTS.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dept.popularSymptoms?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedDepartment = MOCK_DEPARTMENTS.find((d) => d.id === selectedDeptId) || MOCK_DEPARTMENTS[0];

  const handleFindClinics = () => {
    navigation.navigate('MapView', {
      department: selectedDepartment.name,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header Bar with Top Right Theme Toggle */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#06152F' : '#FFFFFF',
            borderBottomColor: theme.cardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.backgroundSoft }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ArrowLeft size={18} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Step 1 of 4</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Choose your department
          </Text>
        </View>

        <ThemeToggle compact />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro Banner */}
        <View style={styles.introContainer}>
          <Text style={[styles.introTitle, { color: theme.textPrimary }]}>
            What medical care do you need?
          </Text>
          <Text style={[styles.introSub, { color: theme.textSecondary }]}>
            Select a specialty to discover verified clinics and specialists near {activeLocation.name}
          </Text>
        </View>

        {/* Department Search Input */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Search size={16} color={theme.textMuted} />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.textPrimary },
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
            ]}
            placeholder="Search department, e.g. Cardiology, Skin, Eye..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={14} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Departments Grid */}
        <View style={styles.departmentsGrid}>
          {filteredDepts.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              isSelected={selectedDeptId === dept.id}
              onPress={() => setSelectedDeptId(dept.id)}
            />
          ))}
        </View>

        {filteredDepts.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No department matched "{searchQuery}".
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Confirmation Bar */}
      <View
        style={[
          styles.footerBar,
          {
            backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
            borderTopColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.footerInfo}>
          <Text style={[styles.footerLabel, { color: theme.textMuted }]}>SELECTED SPECIALTY</Text>
          <Text style={[styles.footerDeptName, { color: theme.textPrimary }]} numberOfLines={1}>
            {selectedDepartment.icon} {selectedDepartment.name}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.findClinicsBtn, { backgroundColor: theme.cta }]}
          onPress={handleFindClinics}
          activeOpacity={0.88}
        >
          <Text style={styles.findClinicsBtnText}>Find Clinics</Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 12,
  },
  introContainer: {
    gap: 3,
  },
  introTitle: {
    ...TYPOGRAPHY.h2,
  },
  introSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
    ...SHADOWS.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  departmentsGrid: {
    gap: 10,
    marginTop: 4,
  },
  emptyBox: {
    padding: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    ...SHADOWS.float,
  },
  footerInfo: {
    flex: 1,
    gap: 1,
  },
  footerLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerDeptName: {
    fontSize: 14,
    fontWeight: '700',
  },
  findClinicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  findClinicsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
