import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { View } from 'react-native';
import { Asset } from 'expo-asset';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from './database/database';
import { UserProvider } from './userContext';
// Prevent auto-hide at the start

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const splash_img = require("@/assets/images/splash_img.png");

  useEffect(() => {
    async function preloadAssets() {
      try {
        await Asset.loadAsync([splash_img]); // Preload the image
        scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        opacity.value = withTiming(1, { duration: 1200 });

        setTimeout(async () => {
          await SplashScreen.hideAsync(); // Hide splash screen properly
          setIsLoading(false);
        }, 2500);
      } catch (error) {
        console.warn("Error loading assets:", error);
      }
    }

    preloadAssets();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
        <StatusBar hidden={true} />
        <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
      </View>
    );
  } else {
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
}