import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, Suspense } from 'react'; // Import Suspense
import 'react-native-reanimated';
import '../global.css'; // Make sure this path is correct relative to app/_layout.tsx
import { View, Modal, Text } from 'react-native';
import { Asset } from 'expo-asset';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
// Import from 'expo-sqlite' (not /next)
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from './database/database'; // Make sure this path is correct
import { UserProvider } from './userContext'; // Make sure this path is correct
import { downloadVideo, clearDownloadedVideos } from "./video/videoDownlaoder"; // Make sure this path is correct
import { ProgressBar } from 'react-native-paper';
import SyncToCloud from '@/components/SyncToCloud'; // Make sure this path is correct

// Prevent auto-hide at the start
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const VIDEO_LIST = [
    // This list determines which videos are downloaded on startup
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

  const [isLoading, setIsLoading] = useState(true); // Tracks if initial assets (like splash image) are loaded
  const scale = useSharedValue(0.5); // For splash animation
  const opacity = useSharedValue(0); // For splash animation
  const splash_img = require("@/assets/images/splash_img.png"); // Make sure path is correct
  const [downloadProgress, setDownloadProgress] = useState(0); // Tracks video download progress
  const [videoAssetsLoaded, setVideoAssetsLoaded] = useState(false); // Tracks if all videos are downloaded
  const glowOpacity = useSharedValue(0.3); // For splash animation glow

  // --- Animation and Asset Preloading Effects ---
  useEffect(() => {
    // Animate glow effect for splash screen
    glowOpacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    // Style for the splash screen glow (applied below if needed)
    shadowOpacity: glowOpacity.value,
    shadowRadius: 10,
    shadowColor: "#6B21A8", // Purple glow color
  }));

  useEffect(() => {
    // Preload splash image and manage splash screen visibility duration
    async function preloadAssets() {
      try {
        await Asset.loadAsync([splash_img]);
        // Animate splash image appearing
        scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        opacity.value = withTiming(1, { duration: 1200 });

        const minimumDisplayTime = 4000; // Keep splash visible for at least 4 seconds
        const startTime = Date.now();

        await SplashScreen.hideAsync(); // Hide the native OS splash screen

        // Calculate remaining time needed for our custom splash
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime);

        // Set isLoading to false after the minimum display time
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } catch (error) {
        console.warn("Error loading splash assets:", error);
        setIsLoading(false); // Ensure loading stops even if assets fail
      }
    }
    preloadAssets();
  }, []); // Run only once on mount

  // --- Video Download Effect ---
  useEffect(() => {
    // Download videos listed in VIDEO_LIST
    (async () => {
      // await clearDownloadedVideos(); // Uncomment only if you need to force re-download for testing
      console.log("Starting video downloads...");
      let completed = 0;
      for (const video of VIDEO_LIST) {
        try {
          await downloadVideo(video.id, video.url);
          console.log(`Successfully downloaded video ${video.id}`);
        } catch (downloadError) {
          console.error(`Failed to download video ${video.id} from ${video.url}:`, downloadError);
          // Optional: Add logic here to retry or notify the user
        }
        completed++;
        setDownloadProgress(completed); // Update progress state
      }
      console.log("All video downloads attempted.");
      setVideoAssetsLoaded(true); // Mark video loading as complete
    })();
  }, []); // Run only once on mount

  const animatedStyle = useAnimatedStyle(() => ({
    // Style for splash image animation
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // --- Render Logic ---

  // 1. Show Custom Splash Screen while initial assets load
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
        <StatusBar hidden={true} />
        {/* You could apply animatedGlow here if you want the image itself to glow */}
        <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
      </View>
    );
  }

  // 2. Show Video Download Modal while videos are downloading
  if (!videoAssetsLoaded) {
    return (
      <Modal visible={!videoAssetsLoaded} transparent={true} animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: 250, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10, color: "#333" }}>
              Downloading Initial Videos...
            </Text>
            <Text style={{ fontSize: 14, color: "#555", marginBottom: 5 }}>
              {downloadProgress} / {VIDEO_LIST.length} completed
            </Text>
            <ProgressBar
              progress={VIDEO_LIST.length > 0 ? downloadProgress / VIDEO_LIST.length : 0}
              color="#6B21A8" // Purple progress bar
              style={{ height: 10, width: 200, borderRadius: 5, marginBottom: 5 }}
            />
            <Text style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
              Please wait, this may take a moment...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // 3. Render the main app content once everything is ready
  return (
    // Wrap the entire app structure in Suspense for SQLite loading
    <Suspense fallback={<Text>Loading Database...</Text>}>
      {/*
        Provide the SQLite database context to the whole app.
        IMPORTANT: Change "test.db" to the actual database filename
        used by your `initializeDatabase` function (e.g., "videos.db").
      */}
      <SQLiteProvider databaseName="videoAnalytics.db" onInit={initializeDatabase} useSuspense>
        {/* Provides user context (like login status) to the app */}
        <UserProvider>
          {/* Defines the navigation structure using Expo Router */}
          <Stack>
            {/* These screens are defined by folders/files in your 'app' directory */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="video" options={{ headerShown: false }} />
            <Stack.Screen name="pdf" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          </Stack>
          {/* Component for syncing data to the cloud (Supabase) */}
          <SyncToCloud />
          {/* Controls the appearance of the device's status bar (time, battery, etc.) */}
          <StatusBar style="light" />
        </UserProvider>
      </SQLiteProvider>
    </Suspense>
  );
}