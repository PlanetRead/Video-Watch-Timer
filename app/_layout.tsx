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
import { ThemeProvider, useTheme } from './themeContext';
import { downloadVideo, clearDownloadedVideos } from "./video/videoDownlaoder";
import { ProgressBar } from 'react-native-paper';
import React from 'react';


// Prevent auto-hide at the start
SplashScreen.preventAutoHideAsync();

// Main Layout component that applies theme
const ThemedLayout = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      },
      headerTintColor: isDarkMode ? '#F3F4F6' : '#1F2937',
      contentStyle: {
        backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
      },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="video" options={{ headerShown: false }} />
      <Stack.Screen name="pdf" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: true }} />
    </Stack>
  );
};

export default function RootLayout() {
  const VIDEO_LIST = [
      { id: '1_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/A_Cloud_of_Trash_English.mp4' },
      { id: '1_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/A_Cloud_of_Trash_Punjabi.mp4' },
      { id: '2_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/A_Street,_or_a_Zoo_English.mp4' },
      { id: '2_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/A_Street,_or_a_Zoo_Punjabi.mp4' },
      { id: '3_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Aaloo_Maaloo_Kaaloo_English.mp4' },
      { id: '3_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Aaloo_Maaloo_Kaaloo_Punjabi.mp4' },
      { id: '4_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_A_Lesson_for_my_Teacher_English.mp4' },
      { id: '4_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Abdul_Kalam,_A_Lesson_for_my_Teacher_Punjabi.mp4' },
      { id: '5_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_Designing_a_Fighter_Jet_English.mp4' },
      { id: '5_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Abdul_Kalam,_Designing_a_Fighter_Jet_Punjabi.mp4' },
      { id: '6_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_Failure_to_Success_English.mp4' },
      { id: '6_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Abdul_Kalam,_Failure_to_Success_Punjabi.mp4' },
      { id: '7_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Ammus_Puppy_English.mp4' },
      { id: '7_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Ammus_Puppy_Punjabi.mp4' },
      { id: '8_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Bheema,_the_Sleepyhead_English.mp4' },
      { id: '8_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Bheema,_the_Sleepyhead_Punjabi.mp4' },
      { id: '9_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Bunty_and_Bubbly_English.mp4' },
      { id: '9_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Bunty_and_Bubbly_Punjabi.mp4' },
      { id: '10_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Moon_and_the_Cap_English.mp4' },
      { id: '10_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/The_Moon_and_the_Cap_Punjabi.mp4' },
      { id: '11_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Princess_Farmer_English.mp4' },
      { id: '11_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/The_Princess_Farmer_Punjabi.mp4' },
      { id: '12_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Too_Big_Too_Small_English.mp4' },
      { id: '12_pa', url: 'https://storage.googleapis.com/bird-planet-read/Videos/punjabi/Too_Big!_Too_Small!_Punjabi.mp4' }
  ];
   
  const [isLoading, setIsLoading] = useState(true);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const splash_img = require("@/assets/images/splash_img.png");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [videoAssetsLoaded, setVideoAssetsLoaded] = useState(false);
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
        
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } catch (error) {
        console.warn("Error loading assets:", error);
        setIsLoading(false); // Ensure we exit loading state even on error
      }
    }
  
    preloadAssets();
  }, []);

  //download the videos on the first installation in the next installation check if they exists or not
  useEffect(() => {
    (async () => {
      // Download all videos
      // await clearDownloadedVideos(); // only for testing purposes don't use it in production
      let completed = 0;
      for (const video of VIDEO_LIST) {
        await downloadVideo(video.id, video.url);
        completed++;
        setDownloadProgress(completed);
      }
      setVideoAssetsLoaded(true);
    })();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));


  return (
    <ThemeProvider>
      <>
        { isLoading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
            <StatusBar hidden={true} />
            <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
          </View>
        )}
        
        { !isLoading && !videoAssetsLoaded && (
          <Modal visible={!videoAssetsLoaded} transparent={true} animationType="fade">
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: 250, alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#333" }}>
                  Downloading Videos...
                </Text>

                <Text style={{ fontSize: 14, color: "#555", marginBottom: 5 }}>
                  {downloadProgress} videos downloaded out of {VIDEO_LIST.length}
                </Text>

                <ProgressBar progress={downloadProgress/VIDEO_LIST.length} color="#6B21A8" style={{ height: 10, width: 200, borderRadius: 5 }} />

                <Text style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
                  Please wait...
                </Text>
              </View>
            </View>
          </Modal>
        )}
        
        { !isLoading && videoAssetsLoaded && (
          <SQLiteProvider databaseName="test.db" onInit={initializeDatabase}>
            <UserProvider>
              <ThemedLayout />
              <StatusBar style="auto" />
            </UserProvider>
          </SQLiteProvider>
        )}
      </>
    </ThemeProvider>
  );
}