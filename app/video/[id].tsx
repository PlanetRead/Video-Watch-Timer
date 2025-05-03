import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text, TouchableOpacity, Image,TouchableWithoutFeedback } from "react-native";
import { videoDetails } from "@/assets/details";
import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useRouter } from "expo-router";
import { useKeepAwake } from 'expo-keep-awake';
import { useSQLiteContext } from "expo-sqlite";
import { getVideoAnalyticsByUser,getUsers } from "../database/database";
import { getVideoUri } from "./videoDownlaoder";
import { BackHandler } from "react-native"; // for handling back button press on android
import { useFocusEffect } from "@react-navigation/native";


//Here back issue is solved but controls by default they are showing......

export default function VideoScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  const [originalOrientation, setOriginalOrientation] = useState<ScreenOrientation.Orientation>();
  const back = require('@/assets/images/back.png');
  const video = videoDetails.find((v) => v.id === id);
  const db = useSQLiteContext();
  const [fileUri, setFileUri] = useState<string | null>(null);
  // const [showControls, setShowControls] = useState(false);
  const [watchTime,setWatchTime] = useState<number|null>(null);
  const [totalWatchTime,setTotalWatchTime] = useState<number>(0);

  
  // Add this new state
  const [videoSource, setVideoSource] = useState<string | null>(null);
  // video_id_language -> video_3_en
  const videoUri = `${video?.id}_${language == "pa" ? "pa" : "en"}`;
  // const videoUri = "video_1";

  useEffect(() => {
    const fetchVideoUri = async () => {
      const uri = await getVideoUri(videoUri);
      // console.log("fileUri: ", uri);
      setFileUri(uri);
      
      // Add this condition
      if (uri && video) {
        setVideoSource(uri);
      }
    };

    fetchVideoUri();
  }, []);

  
  // Move player up here and modify
  const player = useVideoPlayer(
    videoSource || '',
    async (player) => {
      if (!videoSource) return; // Add this check
      
      player.loop = false;
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      setOriginalOrientation(currentOrientation);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      await player.play();
    }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (player?.playing && watchTime === null) {
        setWatchTime(Date.now()); // video started playing after a pause/ from the beginning
        // console.log("Video started playing");
        // console.log("Watch Time: ", watchTime);
      }
  
      if (!player?.playing && watchTime !== null) {
        const now = Date.now();
        // console.log("now",now);
        // console.log("watchTime",watchTime) //video paused stop the clock and calc till now
        const elapsedTime = Math.floor((now - watchTime) / 1000); // in seconds
        // console.log("Elapsed Time: ", elapsedTime);
        setTotalWatchTime(prev => prev + (elapsedTime));
        setWatchTime(null); // reset the watch time
        // console.log("Total Watch Time: ", totalWatchTime);
      }
    }, 1000); // check every second
  
    return () => clearInterval(interval);
  }, [player, watchTime]);
  
  useFocusEffect(() => {
    const backAction = () => {
      // console.log("Back button pressed");
      returnBackToHome(); // Call your function to track analytics & navigate
      return true; // Prevent default back behavior
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
  
    return () => backHandler.remove(); // Cleanup when unmounting
  }); // Add dependencies


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

  
      // Check if the analytics entry exists for this user, video, language, and date
      const existingRecords = await db.getAllAsync(
        "SELECT * FROM video_analytics WHERE user_id = ? AND video_id = ? AND language = ? AND date = ?",
        [userId, videoId, videoLang, today]
      );

      // console.log("Existing Records: ", existingRecords);
  
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
        // console.log(`Updated analytics for Video ${videoId}, Language: ${language} from the videoscreen`);
      } else {
        // Insert a new entry
        await db.runAsync(
          `INSERT INTO video_analytics (user_id, video_id, date, total_views_day, total_time_day, last_time_stamp, language) 
           VALUES (?, ?, ?, 1, ?, ?, ?)`,
          [userId, videoId, today, watchedTime, lastWatchedTimestamp, videoLang]
        );
        // console.log(`Inserted new analytics for Video ${videoId}, Language: ${language}`);
      }
    } catch (error) {
      console.error("Error updating video analytics:", error);
    }
  };
  

  const returnBackToHome = async () => {
    // const watchedTime = Math.floor(player.currentTime);
    // console.log(`Total Watch Time: ${totalWatchTime} seconds`);
    // console.log(`Watched Till: ${watchedTime} seconds from the videoscreen`);
    // console.log(`Total Watch Time: ${totalWatchTime} seconds`);
    await updateVideoAnalytics(totalWatchTime); // ⬅️ Call the function
  
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
    // padding: 40,
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

