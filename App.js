import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Electrike Root Application Entry
 * Managed Expo Workflow with React Navigation & SafeAreaProvider.
 */
export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});
