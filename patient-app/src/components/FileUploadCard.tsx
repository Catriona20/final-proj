import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Upload, FileText, Trash2, X, Plus, Check, Calendar, Building2, HelpCircle } from 'lucide-react-native';
import { UploadedMedicalFile } from '../types';
import { RADIUS, SPACING, SHADOWS, TYPOGRAPHY, getThemeColors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface FileUploadCardProps {
  files: UploadedMedicalFile[];
  onAddFile: (file: UploadedMedicalFile) => void;
  onRemoveFile: (fileId: string) => void;
  disabled?: boolean;
}

const CATEGORIES: UploadedMedicalFile['category'][] = [
  'Lab report',
  'Scan',
  'Prescription',
  'Medical document',
  'Test result',
  'Other',
];

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  files,
  onAddFile,
  onRemoveFile,
  disabled = false,
}) => {
  const { isDark } = useThemeStore();
  const theme = getThemeColors(isDark);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState<UploadedMedicalFile['category']>('Lab report');
  const [clinicPerformed, setClinicPerformed] = useState('');
  const [testDate, setTestDate] = useState('Aug 12, 2026');
  const [reasonForTest, setReasonForTest] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveFile = () => {
    if (!testName.trim()) {
      Alert.alert('Test Name Required', 'Please enter what test or report this is.');
      return;
    }

    const newFile: UploadedMedicalFile = {
      id: `file-${Date.now()}`,
      fileName: `${testName.trim().replace(/\s+/g, '_')}.pdf`,
      fileType: 'PDF',
      fileSize: '1.2 MB',
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      testName: testName.trim(),
      category,
      clinicPerformed: clinicPerformed.trim() || 'Apollo Hospitals / Diagnostic Center',
      testDate: testDate || 'Recent',
      reasonForTest: reasonForTest.trim() || 'Routine diagnostic check',
      notes: notes.trim() || undefined,
    };

    onAddFile(newFile);
    setIsModalVisible(false);

    // Reset form
    setTestName('');
    setCategory('Lab report');
    setClinicPerformed('');
    setReasonForTest('');
    setNotes('');
  };

  return (
    <View style={styles.wrapper}>
      {/* Upload Action Button */}
      {!disabled && (
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            {
              backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
              borderColor: theme.primary,
            },
          ]}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.uploadIconCircle, { backgroundColor: theme.primaryLight }]}>
            <Upload size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.uploadBtnTitle, { color: theme.textPrimary }]}>
              + Upload Previous Reports & Tests
            </Text>
            <Text style={[styles.uploadBtnSub, { color: theme.textMuted }]}>
              PDF, JPG, PNG from previous visits
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <View style={styles.filesList}>
          {files.map((file) => (
            <View
              key={file.id}
              style={[
                styles.fileItem,
                {
                  backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View style={[styles.fileTypeBadge, { backgroundColor: theme.primaryLight }]}>
                <FileText size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {file.testName}
                </Text>
                <Text style={[styles.fileCategory, { color: theme.primary }]}>
                  {file.category} · {file.clinicPerformed}
                </Text>
                <Text style={[styles.fileMeta, { color: theme.textMuted }]}>
                  Date: {file.testDate} {file.reasonForTest ? `· ${file.reasonForTest}` : ''}
                </Text>
              </View>

              {!disabled && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => onRemoveFile(file.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={15} color={theme.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Upload Metadata Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark ? '#0C2347' : '#FFFFFF',
                borderColor: isDark ? '#1A3560' : '#E2E8F0',
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Attach Previous Medical Test
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              {/* Test Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  What test or report is this? *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.textPrimary,
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="e.g. Complete Blood Count, Chest X-Ray, ECG"
                  placeholderTextColor={theme.textMuted}
                  value={testName}
                  onChangeText={setTestName}
                />
              </View>

              {/* Category Chips */}
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Category</Text>
                <View style={styles.categoryChips}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: category === cat ? theme.primary : theme.backgroundSoft,
                          borderColor: category === cat ? theme.primary : theme.cardBorder,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          { color: category === cat ? '#FFFFFF' : theme.textPrimary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clinic Performed */}
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Where was this test performed?
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.textPrimary,
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="e.g. Apollo Diagnostics, MetroCare Clinic"
                  placeholderTextColor={theme.textMuted}
                  value={clinicPerformed}
                  onChangeText={setClinicPerformed}
                />
              </View>

              {/* Test Date */}
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Test Date</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.textPrimary,
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="e.g. Aug 12, 2026"
                  placeholderTextColor={theme.textMuted}
                  value={testDate}
                  onChangeText={setTestDate}
                />
              </View>

              {/* Reason for test */}
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Why was this test done?
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.textPrimary,
                      backgroundColor: theme.backgroundSoft,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="e.g. Routine fever checkup, persistent chest pain"
                  placeholderTextColor={theme.textMuted}
                  value={reasonForTest}
                  onChangeText={setReasonForTest}
                />
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={[styles.modalFooter, { borderTopColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={[styles.saveFileBtn, { backgroundColor: theme.cta }]}
                onPress={handleSaveFile}
                activeOpacity={0.85}
              >
                <Text style={styles.saveFileBtnText}>Attach Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBtnSub: {
    fontSize: 11,
  },
  filesList: {
    gap: 6,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  fileTypeBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 10,
  },
  removeBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  formScroll: {
    padding: SPACING.md,
    gap: 12,
  },
  formGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalFooter: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  saveFileBtn: {
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  saveFileBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
