import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { UploadCloud, CheckCircle2, ShieldCheck, FileText, ArrowRight } from 'lucide-react-native';
import { PALETTE, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useDoctorAuthStore } from '../../store/useDoctorAuthStore';

interface DocumentUploadScreenProps {
  navigation: any;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ navigation }) => {
  const { colors } = useThemeStore();
  const { doctor, uploadVerificationDocument, isLoading } = useDoctorAuthStore();

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({
    medical_reg_cert: false,
    degree_cert: false,
    gov_id: false,
  });

  const docTypes = [
    {
      key: 'medical_reg_cert',
      title: 'State Medical Council Registration',
      subtitle: 'Mandatory license certificate with visible registration number',
      required: true,
    },
    {
      key: 'degree_cert',
      title: 'Medical Degree Certificate (MBBS/BDS/MD)',
      subtitle: 'University graduation certificate and specialization awards',
      required: true,
    },
    {
      key: 'gov_id',
      title: 'Government Identity Proof',
      subtitle: 'Official government photo identification card or passport',
      required: true,
    },
  ];

  const handleSimulateUpload = async (key: string, title: string) => {
    const success = await uploadVerificationDocument(key, `${title}.pdf`);
    if (success) {
      setUploadedDocs((prev) => ({ ...prev, [key]: true }));
    }
  };

  const allUploaded = Object.values(uploadedDocs).every(Boolean);

  const handleComplete = () => {
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.headerBlock}>
          <View style={[styles.shieldIcon, { backgroundColor: colors.primary + '18' }]}>
            <ShieldCheck size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Upload Verification Documents</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            To protect patient safety and prevent fake doctors, please upload your official medical licenses for council review.
          </Text>
        </View>

        {/* DOC UPLOAD CARDS */}
        <View style={styles.docList}>
          {docTypes.map((item) => {
            const isUploaded = uploadedDocs[item.key];

            return (
              <View
                key={item.key}
                style={[
                  styles.docCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isUploaded ? PALETTE.success : colors.border,
                  },
                  SHADOWS.light,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.docIconCircle, { backgroundColor: isUploaded ? PALETTE.successLight : colors.cardSubtle }]}>
                    {isUploaded ? (
                      <CheckCircle2 size={20} color={PALETTE.success} />
                    ) : (
                      <FileText size={20} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.docTextInfo}>
                    <Text style={[styles.docTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.docSubtitle, { color: colors.secondaryText }]}>{item.subtitle}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleSimulateUpload(item.key, item.title)}
                  disabled={isUploaded || isLoading}
                  style={[
                    styles.uploadBtn,
                    {
                      backgroundColor: isUploaded ? PALETTE.successLight : colors.primary + '12',
                      borderColor: isUploaded ? PALETTE.success : colors.primary,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <UploadCloud size={16} color={isUploaded ? PALETTE.success : colors.primary} />
                  <Text
                    style={[
                      styles.uploadBtnText,
                      { color: isUploaded ? PALETTE.success : colors.primary },
                    ]}
                  >
                    {isUploaded ? 'Document Uploaded & Attached ✓' : 'Select & Upload PDF / Image'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleComplete}
          style={[
            styles.submitBtn,
            { backgroundColor: allUploaded ? PALETTE.accent : colors.primary },
            SHADOWS.accentGlow,
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {allUploaded ? 'Proceed to Doctor Dashboard' : 'Skip / Upload Later in Profile'}
          </Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.largeHeading - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  docList: {
    gap: 14,
    marginBottom: 24,
  },
  docCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  docIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  docSubtitle: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  uploadBtnText: {
    fontSize: TYPOGRAPHY.sizes.secondary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.cardTitle,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
