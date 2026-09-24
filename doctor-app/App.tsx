import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/components/SplashScreen';
import { useDoctorAuthStore } from './src/store/useDoctorAuthStore';
import { useDoctorAppStore } from './src/store/useDoctorAppStore';
import { useThemeStore } from './src/store/useThemeStore';
import { initDoctorSocket, disconnectDoctorSocket } from './src/api/socketApi';
import { PALETTE } from './src/constants/theme';

export default function App() {
  const [minSplashDone, setMinSplashDone] = useState(false);
  const {
    initializeAuth,
    doctor,
    isBootstrapping,
    isSplashTriggered,
    clearSplashTrigger,
  } = useDoctorAuthStore();
  const { initializeTheme, isDark } = useThemeStore();
  const {
    activeClinicId,
    handleSocketQueueUpdated,
    handleSocketAppointmentStatus,
    handleSocketAppointmentCreated,
    handleSocketAvailabilityRequestNew,
    handleSocketAvailabilityRequestApproved,
    handleSocketAvailabilityRequestRejected,
  } = useDoctorAppStore();

  useEffect(() => {
    initializeTheme();
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isSplashTriggered) {
      setMinSplashDone(false);
    }
  }, [isSplashTriggered]);

  // Real-time Socket.IO synchronization when doctor is authenticated
  useEffect(() => {
    if (doctor?.id) {
      const socket = initDoctorSocket(doctor.id, activeClinicId || undefined, {
        onQueueUpdated: handleSocketQueueUpdated,
        onAppointmentStatus: handleSocketAppointmentStatus,
        onAppointmentCreated: handleSocketAppointmentCreated,
        onAvailabilityRequestNew: handleSocketAvailabilityRequestNew,
        onAvailabilityRequestApproved: handleSocketAvailabilityRequestApproved,
        onAvailabilityRequestRejected: handleSocketAvailabilityRequestRejected,
      });

      return () => {
        disconnectDoctorSocket();
      };
    }
  }, [doctor?.id, activeClinicId]);

  const isSplashActive = !minSplashDone || isBootstrapping || isSplashTriggered;

  if (isSplashActive) {
    return (
      <SplashScreen
        duration={1200}
        onFinish={() => {
          setMinSplashDone(true);
          clearSplashTrigger();
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
