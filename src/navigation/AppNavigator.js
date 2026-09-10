import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RoutePlanningScreen from '../screens/RoutePlanningScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ActivityScreen from '../screens/ActivityScreen';
import AboutScreen from '../screens/AboutScreen';
import BatteryIndicator from '../components/BatteryIndicator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FAFAF7',
          },
          contentStyle: {
            backgroundColor: '#FAFAF7',
          },
          headerTintColor: '#059669',
          headerTitleStyle: {
            fontWeight: '800',
            color: '#0F172A',
            fontSize: 18,
          },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          headerRight: () => (
            <View style={{ marginRight: 4 }}>
              <BatteryIndicator />
            </View>
          ),
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoutePlanning"
          component={RoutePlanningScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Driver Profile & Garage' }}
        />
        <Stack.Screen
          name="Activity"
          component={ActivityScreen}
          options={{ title: 'Trip Activity' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: 'About Electrike' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
