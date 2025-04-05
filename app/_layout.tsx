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
import { downloadVideo,clearDownloadedVideos } from "./video/videoDownlaoder";
import { ProgressBar } from 'react-native-paper';


// Prevent auto-hide at the start

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const VIDEO_LIST = [
    { id: '1_en', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    { id: '1_pa', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    { id: '2_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    { id: '2_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' }
    // { id: '3_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '3_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '4_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '4_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '5_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '5_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '6_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '6_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '7_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '7_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '8_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '8_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '9_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '9_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '10_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '10_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '11_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '11_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '12_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '12_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '13_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '13_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '14_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '14_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '15_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '15_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '16_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '16_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '17_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '17_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '18_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '18_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '19_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '19_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '20_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '20_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '21_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '21_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '22_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '22_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '23_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '23_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '24_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '24_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '25_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '25_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '26_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '26_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '27_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '27_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '28_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '28_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '29_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '29_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '30_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '30_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '31_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '31_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '32_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '32_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '33_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '33_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '34_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '34_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '35_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '35_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '36_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '36_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '37_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '37_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '38_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '38_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '39_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '39_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '40_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '40_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '41_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '41_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '42_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '42_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '43_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '43_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '44_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '44_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '45_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '45_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '46_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '46_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '47_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '47_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '48_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '48_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '49_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' },
    // { id: '49_pa', url: 'https://storage.googleapis.com/plan--1/BigBuckBunny.mp4' },
    // { id: '50_en', url: 'https://storage.cloud.google.com/plan--1/BigBuckBunny.mp4' }
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

        setTimeout(async () => {
          await SplashScreen.hideAsync(); // Hide splash screen properly
          setIsLoading(false);
        }, 4500);
      } catch (error) {
        console.warn("Error loading assets:", error);
      }
    }

    preloadAssets();
  }, []);

    //download the videos on the first installation in the next installation check if they exists or not
    useEffect(() => {
      (async () => {
        // Download all videos
        await clearDownloadedVideos(); // only for testing purposes don't use it in production
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
    <>
  { isLoading && (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
        <StatusBar hidden={true} />
        <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
      </View>
  )}
  
  { !isLoading && !videoAssetsLoaded && (
        //show a popup of number of videos downloading and stuff.... a progress bar modal
          <Modal visible={!videoAssetsLoaded} transparent={true} animationType="fade">
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: 250, alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#333" }}>
                  Downloading Videos...
                </Text>

                {/* Show number of videos downloaded out of total */}
                <Text style={{ fontSize: 14, color: "#555", marginBottom: 5 }}>
                  {downloadProgress} videos downloaded out of {VIDEO_LIST.length}
                </Text>

                {/* Progress Bar */}
                <ProgressBar progress={downloadProgress/VIDEO_LIST.length} color="#6B21A8" style={{ height: 10, width: 200, borderRadius: 5 }} />

                {/* Optional: Estimated time or animated loading */}
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
  )}
    </>
  )
  
}