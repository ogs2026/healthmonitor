import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HealthMonitor from './src/HealthMonitor';

const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#071426', card: '#10213A', primary: '#8CC5FF', text: '#EAF3FF', border: '#29466B' },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme} documentTitle={{ formatter: () => 'Hubble Health Monitor' }}>
          <HealthMonitor />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
