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

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const splash_img = require("@/assets/images/splash_img.png");

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load assets
        await Asset.loadAsync([splash_img]);

        // Mark app as ready
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = async () => {
    if (appIsReady) {
      // Start animation
      scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
      opacity.value = withTiming(1, { duration: 1200 });

      // Ensure smooth transition before hiding splash
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setIsLoading(false);
      }, 1500);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Show custom splash screen while loading
  if (!appIsReady || !isLoading) {
    return (
      <View 
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}
        onLayout={onLayoutRootView}
      >
        <StatusBar hidden={true} />
        <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#6B21A8" }}> 
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
    </View>
  );
}
