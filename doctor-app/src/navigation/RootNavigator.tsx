import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDoctorAuthStore } from '../store/useDoctorAuthStore';
import { useDoctorAppStore } from '../store/useDoctorAppStore';
import { useThemeStore } from '../store/useThemeStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { SelectClinicScreen } from '../screens/clinic/SelectClinicScreen';
import { DoctorLoadScreen } from '../screens/clinic/DoctorLoadScreen';
import { ConsultationScreen } from '../screens/consultation/ConsultationScreen';
import { DoctorPatientDetailScreen } from '../screens/patients/DoctorPatientDetailScreen';
import { ProcedureManagementScreen } from '../screens/profile/ProcedureManagementScreen';
import { AuditLogsScreen } from '../screens/profile/AuditLogsScreen';
import { VerificationProfileScreen } from '../screens/profile/VerificationProfileScreen';
import { DoctorScheduleScreen } from '../screens/schedule/DoctorScheduleScreen';
import { VerificationPendingScreen } from '../screens/auth/VerificationPendingScreen';
import { DoctorNotificationsScreen } from '../screens/notifications/DoctorNotificationsScreen';
import { PALETTE } from '../constants/theme';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, doctor, isBootstrapping } = useDoctorAuthStore();
  const { activeClinicId } = useDoctorAppStore();
  const { colors, isDark } = useThemeStore();

  if (isBootstrapping) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? PALETTE.backgroundDark : PALETTE.backgroundLight }]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  const isVerified =
    doctor?.is_verified ||
    doctor?.verification_status === 'VERIFIED' ||
    doctor?.verification_status === 'ACTIVE';

  // 1. Unauthenticated Tree -> Renders strictly WelcomeAuth, DoctorLogin, DoctorRegister
  if (!isAuthenticated || !doctor) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Auth">
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // 2. Unverified Doctor Tree -> Gated at VerificationPendingScreen
  if (!isVerified) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="VerificationPending">
        <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
        <Stack.Screen name="VerificationProfile" component={VerificationProfileScreen} />
      </Stack.Navigator>
    );
  }

  // 3. Verified Doctor without Selected Clinic -> Gated at SelectClinicScreen
  if (!activeClinicId) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SelectClinic">
        <Stack.Screen name="SelectClinic" component={SelectClinicScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="DoctorLoad" component={DoctorLoadScreen} />
        <Stack.Screen name="DoctorNotifications" component={DoctorNotificationsScreen} />
        <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="DoctorPatientDetail" component={DoctorPatientDetailScreen} />
        <Stack.Screen name="ProcedureManagement" component={ProcedureManagementScreen} />
        <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
        <Stack.Screen name="VerificationProfile" component={VerificationProfileScreen} />
        <Stack.Screen name="Schedule" component={DoctorScheduleScreen} />
      </Stack.Navigator>
    );
  }

  // 4. Authenticated, Verified Doctor with Active Clinic -> Full Doctor Clinical Workspace
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainTabs">
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="SelectClinic" component={SelectClinicScreen} />
      <Stack.Screen name="DoctorLoad" component={DoctorLoadScreen} />
      <Stack.Screen name="DoctorNotifications" component={DoctorNotificationsScreen} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="DoctorPatientDetail" component={DoctorPatientDetailScreen} />
      <Stack.Screen name="ProcedureManagement" component={ProcedureManagementScreen} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
      <Stack.Screen name="VerificationProfile" component={VerificationProfileScreen} />
      <Stack.Screen name="Schedule" component={DoctorScheduleScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
