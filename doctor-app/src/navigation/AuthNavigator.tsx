import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeAuthScreen } from '../screens/auth/WelcomeAuthScreen';
import { DoctorLoginScreen } from '../screens/auth/DoctorLoginScreen';
import { DoctorRegisterScreen } from '../screens/auth/DoctorRegisterScreen';
import { VerificationPendingScreen } from '../screens/auth/VerificationPendingScreen';
import { DocumentUploadScreen } from '../screens/auth/DocumentUploadScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="DoctorLogin">
      <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
      <Stack.Screen name="WelcomeAuth" component={WelcomeAuthScreen} />
      <Stack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
      <Stack.Screen name="VerificationPending" component={VerificationPendingScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    </Stack.Navigator>
  );
};
