import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { View } from 'react-native';
import { Asset } from 'expo-asset';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from './database/database';
import { UserProvider } from './userContext';

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const splash_img = require("@/assets/images/splash_img.png");

  useEffect(() => {
    async function prepareApp() {
      const startTime = Date.now(); // Start timer

      try {
        // Load assets (Ensuring assets load completely)
        await Asset.loadAsync([splash_img]); 

        // Start animation after assets are loaded
        scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        opacity.value = withTiming(1, { duration: 1200 });

      } catch (error) {
        console.warn("Error loading assets:", error);
      }

      // Ensure minimum splash screen duration of 2500ms
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(2500 - elapsedTime, 0);

      setTimeout(() => {
        setIsAppReady(true);
      }, remainingTime);
    }

    prepareApp();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
        <StatusBar hidden={true} />
        <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName="test.db" onInit={initializeDatabase}>
      <UserProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="video" options={{ headerShown: false }} />
          <Stack.Screen name="pdf" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </UserProvider>
    </SQLiteProvider>
  );
}
