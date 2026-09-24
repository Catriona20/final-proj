import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { COLORS } from '../constants/theme';

import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { AppointmentsScreen } from '../screens/appointments/AppointmentsScreen';
import { HealthRecordsScreen } from '../screens/health/HealthRecordsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { FloatingTabBar } from '../components/FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Book' }}
      />
      <Tab.Screen
        name="HealthRecordsTab"
        component={HealthRecordsScreen}
        options={{ tabBarLabel: 'Records' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};
