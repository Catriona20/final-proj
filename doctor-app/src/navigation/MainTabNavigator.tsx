import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Users, MapPin, UserCheck, User } from 'lucide-react-native';
import { DoctorHomeScreen } from '../screens/home/DoctorHomeScreen';
import { DoctorAppointmentsScreen } from '../screens/appointments/DoctorAppointmentsScreen';
import { DoctorQueueScreen } from '../screens/queue/DoctorQueueScreen';
import { DoctorMapScreen } from '../screens/map/DoctorMapScreen';
import { DoctorPatientsScreen } from '../screens/patients/DoctorPatientsScreen';
import { DoctorProfileScreen } from '../screens/profile/DoctorProfileScreen';
import { useThemeStore } from '../store/useThemeStore';
import { TYPOGRAPHY } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { colors } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.sizes.micro,
          fontWeight: TYPOGRAPHY.weights.bold,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DoctorHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={DoctorAppointmentsScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, size }) => <Calendar size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Queue"
        component={DoctorQueueScreen}
        options={{
          tabBarLabel: 'Live Queue',
          tabBarIcon: ({ color, size }) => <Users size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={DoctorMapScreen}
        options={{
          tabBarLabel: 'Clinic Map',
          tabBarIcon: ({ color, size }) => <MapPin size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Patients"
        component={DoctorPatientsScreen}
        options={{
          tabBarLabel: 'Patients',
          tabBarIcon: ({ color, size }) => <UserCheck size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DoctorProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
