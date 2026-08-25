import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import SensorDebugScreen from '../screens/SensorDebugScreen';
import SafeWalkScreen from '../screens/SafeWalkScreen';
import ContactsScreen from '../screens/ContactsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicalIdScreen from '../screens/MedicalIdScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CountdownScreen from '../screens/CountdownScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

import * as Perms from '../services/permissions';
import { subscribe } from '../services/triggers/triggerBus';
import { navigationRef, navigate } from './navigationRef';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS = {
  Home: 'shield-checkmark',
  Sensors: 'pulse',
  'Safe Walk': 'walk',
  Contacts: 'people',
  Settings: 'settings',
};

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.ink,
    card: colors.surface,
    border: colors.line,
    text: colors.text,
    primary: colors.safe,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.safe,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Sensors" component={SensorDebugScreen} />
      <Tab.Screen name="Safe Walk" component={SafeWalkScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [onboarded, setOnboarded] = useState(null); // null while loading

  useEffect(() => {
    Perms.hasOnboarded().then(setOnboarded);
  }, []);

  // Any trigger - fall, shake, panic button - opens the countdown. The bus
  // debounces, so two sources firing together still give one alert.
  useEffect(() => subscribe((event) => navigate('Countdown', { event })), []);

  if (onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.safe} />
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingScreen onDone={() => Perms.setOnboarded().then(() => setOnboarded(true))} />;
  }

  return (
    <NavigationContainer theme={theme} ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Medical ID" component={MedicalIdScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        {/* Full screen so the countdown covers the tab bar. Gestures off so
            it cannot be swiped away by accident. */}
        <Stack.Screen
          name="Countdown"
          component={CountdownScreen}
          options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}