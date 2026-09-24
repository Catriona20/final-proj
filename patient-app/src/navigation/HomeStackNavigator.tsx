import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ClinicDetailScreen } from '../screens/clinic/ClinicDetailScreen';
import { MapScreen } from '../screens/map/MapScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen
      name="ClinicDetail"
      component={ClinicDetailScreen}
      options={{
        presentation: 'card',
        gestureEnabled: true,
      }}
    />
    <Stack.Screen
      name="MapView"
      component={MapScreen}
      options={{
        presentation: 'card',
        gestureEnabled: true,
      }}
    />
  </Stack.Navigator>
);
