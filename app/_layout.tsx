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
// import { NavigationContainer } from '@react-navigation/native';


// Prevent auto-hide at the start

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const VIDEO_LIST = [
    // Video 1 - A Cloud of Trash
    { id: '1_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/A_Cloud_of_Trash_English.mp4' },
    { id: '1_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/A_Cloud_of_Trash_Hindi.mp4' },
    
    // Video 2 - A Street or a Zoo
    { id: '2_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/A_Street,_or_a_Zoo_English.mp4' },
    { id: '2_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/A_Street,_or_a_Zoo_Hindi.mp4' },
    
    // // Video 3 - Aaloo Maaloo Kaaloo
    // { id: '3_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Aaloo_Maaloo_Kaaloo_English.mp4' },
    // { id: '3_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Aaloo_Maaloo_Kaaloo_Hindi.mp4' },
    
    // // Video 4 - Abdul Kalam, A Lesson for my Teacher
    // { id: '4_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_A_Lesson_for_my_Teacher_English.mp4' },
    // { id: '4_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Abdul_Kalam,_A_Lesson_for_my_Teacher_Hindi.mp4' },
    
    // // Video 5 - Abdul Kalam, Designing a Fighter Jet
    // { id: '5_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_Designing_a_Fighter_Jet_English.mp4' },
    // { id: '5_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Abdul_Kalam,_Designing_a_Fighter_Jet_Hindi.mp4' },
    
    // // Video 6 - Abdul Kalam, Failure to Success
    // { id: '6_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_Failure_to_Success_English.mp4' },
    // { id: '6_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Abdul_Kalam,_Failure_to_Success_Hindi.mp4' },
    
    // // Video 7 - Abdul Kalam, Missile Man
    // { id: '7_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_Missile_Man_English.mp4' },
    // { id: '7_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Abdul_Kalam,_Missile_Man_Hindi.mp4' },
    
    // // Video 8 - Abdul Kalam, School Topper
    // { id: '8_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Abdul_Kalam,_School_Topper_English.mp4' },
    // { id: '8_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Abdul_Kalam,_School_Topper_Hindi.mp4' },
    
    // // Video 9 - Ammus Puppy
    // { id: '9_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Ammus_Puppy_English.mp4' },
    // { id: '9_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Ammus_Puppy_Hindi.mp4' },
    
    // // Video 10 - Bheema, the Sleepyhead
    // { id: '10_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Bheema,_the_Sleepyhead_English.mp4' },
    // { id: '10_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Bheema,_the_Sleepyhead_Hindi.mp4' },
    
    // // Video 11 - Bunty and Bubbly
    // { id: '11_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Bunty_and_Bubbly_English.mp4' },
    // { id: '11_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Bunty_and_Bubbly_Hindi.mp4' },
    
    // // Video 12 - Cheeku & Chikootichoo
    // { id: '12_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Cheeku_&_Chikootichoo_English.mp4' },
    // { id: '12_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Cheeku_&_Chikootichoo_Hindi.mp4' },
    
    // // Video 13 - Cheeku & Lizzy Bizzy
    // { id: '13_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Cheeku_&_Lizzy_Bizzy_English.mp4' },
    // { id: '13_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Cheeku_&_Lizzy_Bizzy_Hindi.mp4' },
    
    // // Video 14 - Cheeku & Tooi
    // { id: '14_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Cheeku_&_Tooi_English.mp4' },
    // { id: '14_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Cheeku_&_Tooi_Hindi.mp4' },
    
    // // Video 15 - Cricket at the Zoo
    // { id: '15_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Cricket_at_the_Zoo_English.mp4' },
    // { id: '15_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Cricket_at_the_Zoo_Hindi.mp4' },
    
    // // Video 16 - Didi and the Colourful Treasure
    // { id: '16_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Didi_and_the_Colourful_Treasure_English.mp4' },
    // { id: '16_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Didi_and_the_Colourful_Treasure_Hindi.mp4' },
    
    // // Video 17 - Farida Plans a Feast
    // { id: '17_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Farida_Plans_a_Feast_English.mp4' },
    // { id: '17_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Farida_Plans_a_Feast_Hindi.mp4' },
    
    // // Video 18 - Gajapati Kulapati
    // { id: '18_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Gajapati_Kulapati_English.mp4' },
    // { id: '18_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Gajapati_Kulapati_Hindi.mp4' },
    
    // // Video 19 - Kiran Bedi, Crane Bedi
    // { id: '19_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Kiran_Bedi,_Crane_Bedi_English.mp4' },
    // { id: '19_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Kiran_Bedi,_Crane_Bedi_Hindi.mp4' },
    
    // // Video 20 - Kiran Bedi, How to Lose a Shoe
    // { id: '20_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Kiran_Bedi,_How_to_Lose_a_Shoe_English.mp4' },
    // { id: '20_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Kiran_Bedi,_How_to_Lose_a_Shoe_Hindi.mp4' },
    
    // // Video 21 - Kiran Bedi, Thank you Mr. Secretary
    // { id: '21_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Kiran_Bedi,_Thank_you_Mr._Secretary_English.mp4' },
    // { id: '21_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Kiran_Bedi,_Thank_you_Mr._Secretary_Hindi.mp4' },
    
    // // Video 22 - Kiran Bedi, Tihar Jail
    // { id: '22_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Kiran_Bedi,_Tihar_Jail_English.mp4' },
    // { id: '22_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Kiran_Bedi,_Tihar_Jail_Hindi.mp4' },
    
    // // Video 23 - Lost and Found
    // { id: '23_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Lost_and_Found_English.mp4' },
    // { id: '23_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Lost_and_Found_Hindi.mp4' },
    
    // // Video 24 - Mahatma Gandhi, The Salt March
    // { id: '24_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Mahatma_Gandhi,_The_Salt_March_English.mp4' },
    // { id: '24_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Mahatma_Gandhi,_The_Salt_March_Hindi.mp4' },
    
    // // Video 25 - My Car
    // { id: '25_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/My_Car_English.mp4' },
    // { id: '25_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/My_Car_Hindi.mp4' },
    
    // // Video 26 - No Smiles Today
    // { id: '26_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/No_Smiles_Today_English.mp4' },
    // { id: '26_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/No_Smiles_Today_Hindi.mp4' },
    
    // // Video 27 - Pishi Caught in a Storm
    // { id: '27_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Pishi_Caught_in_a_Storm_English.mp4' },
    // { id: '27_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Pishi_Caught_in_a_Storm_Hindi.mp4' },
    
    // // Video 28 - Punyakoti, the Cow
    // { id: '28_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Punyakoti,_the_Cow_English.mp4' },
    // { id: '28_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Punyakoti,_the_Cow_Hindi.mp4' },
    
    // // Video 29 - Rain Rain
    // { id: '29_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Rain_Rain_English.mp4' },
    // { id: '29_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Rain_Rain_Hindi.mp4' },
    
    // // Video 30 - Ranis First Day at School
    // { id: '30_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Ranis_First_Day_at_School_English.mp4' },
    // { id: '30_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Ranis_First_Day_at_School_Hindi.mp4' },
    
    // // Video 31 - Rosa Goes to the City
    // { id: '31_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Rosa_Goes_to_the_City_English.mp4' },
    // { id: '31_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Rosa_Goes_to_the_City_Hindi.mp4' },
    
    // // Video 32 - Satya, Watch Out!
    // { id: '32_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Satya,_Watch_Out!_English.mp4' },
    // { id: '32_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Satya,_Watch_Out!_Hindi.mp4' },
    
    // // Video 33 - The First Well
    // { id: '33_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_First_Well_English.mp4' },
    // { id: '33_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_First_Well_Hindi.mp4' },
    
    // // Video 34 - The Flying Elephant
    // { id: '34_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Flying_Elephant_English.mp4' },
    // { id: '34_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Flying_Elephant_Hindi.mp4' },
    
    // // Video 35 - The Four Friends
    // { id: '35_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Four_Friends_English.mp4' },
    // { id: '35_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Four_Friends_Hindi.mp4' },
    
    // // Video 36 - The Greatest Treasure
    // { id: '36_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Greatest_Treasure_English.mp4' },
    // { id: '36_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Greatest_Treasure_Hindi.mp4' },
    
    // // Video 37 - The Kings Secret
    // { id: '37_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Kings_secret_English.mp4' },
    // { id: '37_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Kings_secret_Hindi.mp4' },
    
    // // Video 38 - The Lion and the Fox
    // { id: '38_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Lion_and_the_Fox_English.mp4' },
    // { id: '38_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Lion_and_the_Fox_Hindi.mp4' },
    
    // // Video 39 - The Monks New Shawl
    // { id: '39_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Monks_New_Shawl_English.mp4' },
    // { id: '39_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Monks_New_Shawl_Hindi.mp4' },
    
    // // Video 40 - The Moon and the Cap
    // { id: '40_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Moon_and_the_Cap_English.mp4' },
    // { id: '40_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Moon_and_the_Cap_Hindi.mp4' },
    
    // // Video 41 - The Princess Farmer
    // { id: '41_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Princess_Farmer_English.mp4' },
    // { id: '41_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Princess_Farmer_Hindi.mp4' },
    
    // // Video 42 - The Talkative Tortoise
    // { id: '42_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Talktative_Tortoise_English.mp4' },
    // { id: '42_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Talktative_Tortoise_Hindi.mp4' },
    
    // // Video 43 - The Wind and the Sun
    // { id: '43_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/The_Wind_and_the_Sun_English.mp4' },
    // { id: '43_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/The_Wind_and_the_Sun_Hindi.mp4' },
    
    // // Video 44 - Timmy and Pepe
    // { id: '44_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Timmy_and_Pepe_English.mp4' },
    // { id: '44_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Timmy_and_Pepe_Hindi.mp4' },
    
    // // Video 45 - Too Big! Too Small!
    // { id: '45_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Too_Big!_Too_Small!_English.mp4' },
    // { id: '45_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Too_Big!_Too_Small!_Hindi.mp4' },
    
    // // Video 46 - Too Many Bananas
    // { id: '46_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Too_Many_Bananas_English.mp4' },
    // { id: '46_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Too_Many_Bananas_Hindi.mp4' },
    
    // // Video 47 - Too Much Noise
    // { id: '47_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Too_Much_Noise_English.mp4' },
    // { id: '47_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Too_Much_Noise_Hindi.mp4' },
    
    // // Video 48 - Turtles Flute
    // { id: '48_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Turtles_Flute_English.mp4' },
    // { id: '48_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Turtles_Flute_Hindi.mp4' },
    
    // // Video 49 - Vayu, the Wind
    // { id: '49_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/Vayu,_the_Wind_English.mp4' },
    // { id: '49_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/Vayu,_the_Wind_Hindi.mp4' },
    
    // Video 50 - What did you see
    { id: '50_en', url: 'https://storage.googleapis.com/bird-planet-read/Videos/English/What_did_you_see_English.mp4' },
    { id: '50_hi', url: 'https://storage.googleapis.com/bird-planet-read/Videos/Hindi/What_did_you_see_Hindi.mp4' }
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