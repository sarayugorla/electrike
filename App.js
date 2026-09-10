import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { BatteryProvider } from './src/context/BatteryContext';

/**
 * Electrike Root Application Entry
 * Managed Expo Workflow with React Navigation, SafeAreaProvider & Global BatteryContext.
 */
export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FAFAF7" />
      <BatteryProvider>
        <AppNavigator />
      </BatteryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
});
