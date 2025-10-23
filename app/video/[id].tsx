import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text, TouchableOpacity, Image, TouchableWithoutFeedback } from "react-native";
import { videoDetails } from "@/assets/details";
import { useEffect, useState, useRef } from "react"; // --- FIX: Import 'useRef' ---
import * as ScreenOrientation from "expo-screen-orientation";
import { useRouter } from "expo-router";
import { useKeepAwake } from 'expo-keep-awake';
import { useSQLiteContext } from "expo-sqlite";
import { getVideoAnalyticsByUser, getUsers } from "../database/database";
import { getVideoUri } from "./videoDownlaoder";
import { BackHandler } from "react-native"; // for handling back button press on android
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VideoScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  const [originalOrientation, setOriginalOrientation] = useState<ScreenOrientation.Orientation>();
  const back = require('@/assets/images/back.png');
  const video = videoDetails.find((v) => v.id === id);
  const db = useSQLiteContext();
  const [fileUri, setFileUri] = useState<string | null>(null);

  // --- FIX: Create a ref to track if the component is mounted ---
  const isMountedRef = useRef(true);
  
  // References to track watch time that won't be affected by React's asynchronous updates
  const watchStartTimeRef = useRef<number | null>(null);
  const totalWatchTimeRef = useRef<number>(0);
  const videoCompletedRef = useRef<boolean>(false); // Track if video has finished playing
  const [videoSource, setVideoSource] = useState<string | null>(null);
  
  // video_id_language -> video_3_en
  const videoUri = `${video?.id}_${language == "pa" ? "pa" : "en"}`;

  useEffect(() => {
    // --- FIX: Set the ref to false when the component unmounts ---
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchVideoUri = async () => {
      const uri = await getVideoUri(videoUri);
      
      // --- FIX: Add a "guard" to check if component is still mounted ---
      if (!isMountedRef.current) {
        return; // Stop execution if component unmounted
      }

      setFileUri(uri);
      
      if (uri && video) {
        setVideoSource(uri);
      }
    };

    fetchVideoUri();
  }, []);

  const player = useVideoPlayer(
    videoSource || '',
    async (player) => {
      if (!videoSource) return;
      
      player.loop = false;
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      
      // --- FIX: Add a "guard" to check if component is still mounted ---
      if (!isMountedRef.current) {
        return; // Stop execution if component unmounted
      }

      setOriginalOrientation(currentOrientation);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      
      // Add listener to detect when video finishes
      player.addListener('statusChange', (status) => {
        // Check if video has reached the end
        if (status.status === 'idle' || (status as any).didJustFinish) {
          console.log('Video finished playing - stopping time tracking');
          videoCompletedRef.current = true;
          // Stop current tracking if video is finished
          if (watchStartTimeRef.current !== null) {
            const elapsedTime = Math.ceil((Date.now() - watchStartTimeRef.current) / 1000);
            totalWatchTimeRef.current += elapsedTime;
            watchStartTimeRef.current = null;
            console.log(`Video completed - final watch time: ${totalWatchTimeRef.current}s`);
          }
        }
      });
      
      await player.play();
    }
  );

  // More reliable way to track watch time using refs
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't track time if video has completed
      if (videoCompletedRef.current) {
        return;
      }

      // Additional check: if video is near the end, consider it completed
      if (player?.status && typeof player.status === 'object' && 'currentTime' in player.status && 'duration' in player.status) {
        const currentTime = (player.status as any).currentTime;
        const duration = (player.status as any).duration;
        if (currentTime >= duration - 1) { // Within 1 second of the end
          console.log('Video reached end - stopping time tracking');
          videoCompletedRef.current = true;
          if (watchStartTimeRef.current !== null) {
            const elapsedTime = Math.ceil((Date.now() - watchStartTimeRef.current) / 1000);
            totalWatchTimeRef.current += elapsedTime;
            watchStartTimeRef.current = null;
          }
          return;
        }
      }

      if (player?.playing && watchStartTimeRef.current === null) {
        watchStartTimeRef.current = Date.now(); // Start tracking when video plays
        console.log('Started tracking video watch time');
      }
  
      if (!player?.playing && watchStartTimeRef.current !== null) {
        // Calculate time watched during this play segment
        const elapsedTime = Math.ceil((Date.now() - watchStartTimeRef.current) / 1000); // Convert to seconds
        // Add to total watch time using the ref (not state)
        totalWatchTimeRef.current += elapsedTime;
        watchStartTimeRef.current = null; // Reset for next play segment
        console.log(`Paused tracking - added ${elapsedTime}s, total: ${totalWatchTimeRef.current}s`);
      }
    }, 1000); // Check every second
  
    return () => clearInterval(interval);
  }, [player]);
  
  useFocusEffect(() => {
    const backAction = () => {
      returnBackToHome();
      return true; // Prevent default back behavior
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove(); // Cleanup when unmounting
  });

  // Restore original orientation when exiting
  useEffect(() => {
    return () => {
      if (originalOrientation) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
      }
    };
  }, [originalOrientation]);

  const updateVideoAnalytics = async (watchedTime: number) => {
    try {
      const users = await getUsers(db);
      const userId = users[0].id // need to get this from db

      const videoId = parseInt(id ?? "0"); // Ensure videoId is a number
      const videoLang = language ?? "en"; // Default to "en" if undefined
      const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
      const lastWatchedTimestamp = new Date().toISOString(); // Get full timestamp

      console.log(`Updating analytics with: userId=${userId}, videoId=${videoId}, language=${videoLang}, watchedTime=${watchedTime}s`);
  
      // Check if the analytics entry exists for this user, video, language, and date
      const existingRecords = await db.getAllAsync(
        "SELECT * FROM video_analytics WHERE user_id = ? AND video_id = ? AND language = ? AND date = ?",
        [userId, videoId, videoLang, today]
      );

      if (existingRecords.length > 0) {
        // Update existing analytics entry
        await db.runAsync(
          `UPDATE video_analytics 
           SET total_views_day = total_views_day + 1, 
               total_time_day = total_time_day + ?, 
               last_time_stamp = ? 
           WHERE user_id = ? AND video_id = ? AND language = ? AND date = ?`,
          [watchedTime, lastWatchedTimestamp, userId, videoId, videoLang, today]
        );
        console.log(`Updated analytics for Video ${videoId}, Language: ${videoLang} with ${watchedTime}ms`);
      } else {
        // Insert a new entry
        await db.runAsync(
          `INSERT INTO video_analytics (user_id, video_id, date, total_views_day, total_time_day, last_time_stamp, language) 
           VALUES (?, ?, ?, 1, ?, ?, ?)`,
          [userId, videoId, today, watchedTime, lastWatchedTimestamp, videoLang]
        );
        console.log(`Inserted new analytics for Video ${videoId}, Language: ${videoLang} with ${watchedTime}ms`);
      }

      // Trigger sync after analytics update
      await AsyncStorage.setItem('triggerSync', Date.now().toString());
    } catch (error) {
      console.error("Error updating video analytics:", error);
    }
  };
  
  const returnBackToHome = async () => {
    // --- FIX: We must set the isMountedRef to false *before* navigating away ---
    isMountedRef.current = false;

    // Calculate final watch time including current playing segment if video is still playing
    let finalWatchTime = totalWatchTimeRef.current;
    
    // Only add current segment time if video hasn't completed and is still playing
    if (player?.playing && watchStartTimeRef.current !== null && !videoCompletedRef.current) {
      // Add the current play segment if video is still playing
      finalWatchTime += (Math.ceil((Date.now() - watchStartTimeRef.current)/1000));
    }
    
    console.log(`Total Watch Time: ${finalWatchTime} seconds (Video completed: ${videoCompletedRef.current})`);
    
    // Only update analytics if there's actual watch time
    if (finalWatchTime > 0) {
      await updateVideoAnalytics(finalWatchTime);
    }
  
    if (player) {
      player.pause();
    }
  
    if (originalOrientation) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    }
    
    router.push(`/`);
  };
  
  return (
    <View style={styles.fullscreenContainer}>
      <TouchableOpacity
        className="absolute top-[43%] left-2 bg-white rounded-full p-2 z-10 shadow-lg shadow-black"
        onPress={returnBackToHome}
      >
        <Image className="w-8 h-8" source={back} />
      </TouchableOpacity>

      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  video: {
    width: "100%",
    height: "110%",
    resizeMode: "contain",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
});