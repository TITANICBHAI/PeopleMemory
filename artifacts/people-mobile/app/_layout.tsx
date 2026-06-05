import 'react-native-get-random-values';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Device from 'expo-device';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/constants/colors';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootedDeviceScreen() {
  return (
    <View style={rd.root}>
      <Text style={rd.icon}>🔒</Text>
      <Text style={rd.title}>Device Not Supported</Text>
      <Text style={rd.body}>
        People Memory cannot run on rooted or jailbroken devices. This restriction is in place to
        protect the privacy and security of your data.
      </Text>
      <Text style={rd.sub}>Please use an unmodified device to continue.</Text>
    </View>
  );
}

const rd = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  icon: { fontSize: 52, marginBottom: 20 },
  title: {
    fontSize: 22, fontWeight: '700', color: '#FFFFFF',
    marginBottom: 14, textAlign: 'center',
  },
  body: {
    fontSize: 15, color: '#D4D4D4', textAlign: 'center',
    lineHeight: 24, marginBottom: 16,
  },
  sub: { fontSize: 13, color: '#888888', textAlign: 'center' },
});

function ThemedShell() {
  const C = useColors();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="add" />
        <Stack.Screen name="edit/[id]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="groups" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="prep/[id]" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [isRooted, setIsRooted] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsRooted(false);
      return;
    }
    Device.isRootedExperimentalAsync()
      .then(rooted => setIsRooted(rooted))
      .catch(() => setIsRooted(false));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isRooted !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isRooted]);

  if (!fontsLoaded && !fontError) return null;
  if (isRooted === null) return null;

  if (isRooted) {
    return (
      <SafeAreaProvider>
        <RootedDeviceScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AppProvider>
            <ThemedShell />
          </AppProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
