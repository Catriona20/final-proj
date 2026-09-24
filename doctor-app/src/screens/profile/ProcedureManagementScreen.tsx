import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Check, Plus, Layers, ShieldCheck } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';
import { procedureApi } from '../../api/procedureApi';
import { Procedure, DoctorProcedure } from '../../types';

interface ProcedureManagementScreenProps {
  navigation: any;
}

export const ProcedureManagementScreen: React.FC<ProcedureManagementScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { doctor } = useDoctorAuthStore();

  const [catalog, setCatalog] = useState<Procedure[]>([]);
  const [myProcedures, setMyProcedures] = useState<DoctorProcedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('Dentistry');

  const departments = ['Dentistry', 'General Medicine', 'Cardiology', 'Dermatology', 'Orthopedics'];

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [catRes, myRes] = await Promise.all([
        procedureApi.getCatalog(selectedDept),
        procedureApi.getMyProcedures(),
      ]);
      setCatalog(catRes.procedures || []);
      setMyProcedures(myRes.procedures || []);
    } catch (e) {
      console.warn('Failed to load procedures:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProcedure = async (procedure: Procedure) => {
    const isMapped = myProcedures.some((p) => p.procedure_name.toLowerCase() === procedure.name.toLowerCase());

    try {
      if (isMapped) {
        const res = await procedureApi.removeProcedure(procedure.name);
        setMyProcedures(res.procedures);
      } else {
        const res = await procedureApi.addProcedure(procedure.name, procedure.id);
        setMyProcedures(res.procedures);
      }
    } catch (e: any) {
      Alert.alert('Notice', e.message || 'Procedure preference updated.');
    }
  };

  const isProcActive = (name: string) => {
    return myProcedures.some((p) => p.procedure_name.toLowerCase() === name.toLowerCase());
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleColumn}>
            <Text style={[styles.title, { color: colors.text }]}>Procedure Skills Catalog</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Structured clinical taxonomy for patient discovery</Text>
          </View>
        </View>

        {/* DEPARTMENT SELECTOR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptRow}>
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept}
              onPress={() => setSelectedDept(dept)}
              style={[
                styles.deptChip,
                {
                  backgroundColor: selectedDept === dept ? colors.primary : colors.card,
                  borderColor: selectedDept === dept ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.deptText, { color: selectedDept === dept ? '#FFFFFF' : colors.text }]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* MAPPED PROCEDURES LIST */}
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            <View style={[styles.infoBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <ShieldCheck size={18} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                Procedures checked here allow patients searching for specific treatments (e.g. Root Canal, Dental Implants) to discover your verified practice.
              </Text>
            </View>

            {catalog.map((proc) => {
              const active = isProcActive(proc.name);

              return (
                <TouchableOpacity
                  key={proc.id}
                  onPress={() => handleToggleProcedure(proc)}
                  style={[
                    styles.procCard,
                    {
                      backgroundColor: active ? colors.primary + '10' : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                    SHADOWS.light,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.procInfo}>
                    <Text style={[styles.procName, { color: colors.text }]}>{proc.name}</Text>
                    <Text style={[styles.procDept, { color: colors.secondaryText }]}>
                      Department: {proc.department}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.toggleCircle,
                      {
                        backgroundColor: active ? colors.primary : colors.cardSubtle,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {active ? <Check size={16} color="#FFFFFF" /> : <Plus size={16} color={colors.secondaryText} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    padding: 6,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sectionHeading,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  deptRow: {
    maxHeight: 44,
    marginBottom: 14,
  },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  deptText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 30,
    gap: 10,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  infoBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.secondary,
    lineHeight: 16,
  },
  procCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  procInfo: {
    flex: 1,
  },
  procName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  procDept: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
  },
  toggleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
