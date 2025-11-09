import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { View, Modal, Text } from 'react-native';
import { Asset } from 'expo-asset';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from './database/database';
import { UserProvider } from './userContext';
// import { NavigationContainer } from '@react-navigation/native';


// Prevent auto-hide at the start

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const splash_img = require("@/assets/images/splash_img.png");
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true); // Repeats the glow effect
  }, []);
  
  const animatedGlow = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    shadowRadius: 10,
    shadowColor: "#6B21A8",
  }));

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    async function preloadAssets() {
      try {
        await Asset.loadAsync([splash_img]); // Preload the image
        scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        opacity.value = withTiming(1, { duration: 1200 });
  
        // Set a minimum display time for the splash screen (e.g., 3000ms = 3 seconds)
        const minimumDisplayTime = 4000;
        const startTime = Date.now();
        
        await SplashScreen.hideAsync(); // Hide the system splash screen
  
        // Ensure our custom splash screen stays visible for the minimum time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime);
        
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } catch (error) {
        console.warn("Error loading assets:", error);
        setIsLoading(false); // Ensure we exit loading state even on error
      }
    }
  
    preloadAssets();
    
    // Cleanup timeout if component unmounts
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

    // No longer downloading videos from cloud - videos are uploaded by admin

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));


  return (
    <>
      {isLoading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
          <StatusBar hidden={true} />
          <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
        </View>
      )}
      
      {!isLoading && (
        <SQLiteProvider databaseName="test.db" onInit={initializeDatabase}>
          <UserProvider>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Let expo-router auto-discover routes */}
            </Stack>
            <StatusBar style="light" />
          </UserProvider>
        </SQLiteProvider>
      )}
    </>
  );
}