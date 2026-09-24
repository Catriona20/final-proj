import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Shield, Clock, Activity, CheckCircle2 } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { doctorApi } from '../../api/doctorApi';
import { AuditLog } from '../../types';

interface AuditLogsScreenProps {
  navigation: any;
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await doctorApi.getAuditLogs();
      setLogs(res.logs || []);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return PALETTE.primary;
      case 'CREATE_CONSULTATION':
        return PALETTE.accent;
      case 'VIEW_PATIENT_RECORD':
        return PALETTE.secondary;
      case 'REPORT_DELAY':
        return PALETTE.warning;
      default:
        return colors.secondaryText;
    }
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
            <Text style={[styles.title, { color: colors.text }]}>Clinical Audit Logs</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Immutable compliance record of all practitioner actions
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {logs.map((log) => {
              const actionColor = getActionColor(log.action);

              return (
                <View
                  key={log.id}
                  style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }, SHADOWS.light]}
                >
                  <View style={styles.logHeaderRow}>
                    <View style={[styles.actionBadge, { backgroundColor: actionColor + '18' }]}>
                      <Text style={[styles.actionBadgeText, { color: actionColor }]}>{log.action}</Text>
                    </View>
                    <View style={styles.timestampRow}>
                      <Clock size={12} color={colors.secondaryText} />
                      <Text style={[styles.timestampText, { color: colors.secondaryText }]}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.detailsText, { color: colors.text }]}>{log.details}</Text>

                  <View style={styles.logFooter}>
                    <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                      Entity: {log.entity_type} • ID: {log.entity_id || 'System'}
                    </Text>
                  </View>
                </View>
              );
            })}

            {logs.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No audit log events recorded yet.</Text>
            )}
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
    marginBottom: 16,
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 30,
    gap: 10,
  },
  logCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: TYPOGRAPHY.sizes.micro,
    fontWeight: TYPOGRAPHY.weights.extraBold,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
  },
  detailsText: {
    fontSize: TYPOGRAPHY.sizes.body,
    lineHeight: 18,
  },
  logFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#E2E8F030',
    paddingTop: 6,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.micro,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 30,
  },
});
