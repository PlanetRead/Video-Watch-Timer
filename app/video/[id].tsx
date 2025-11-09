import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, TouchableOpacity, Image, Dimensions } from "react-native";
import { useEffect, useState, useRef } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useRouter } from "expo-router";
import { useKeepAwake } from 'expo-keep-awake';
import { useSQLiteContext } from "expo-sqlite";
import { getUsers, getVideoById, recordWatchSession } from "../database/database";
import { getVideoUri } from "./videoDownlaoder";
import { BackHandler } from "react-native"; // for handling back button press on android
import { useFocusEffect } from "@react-navigation/native";

export default function VideoScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  const [originalOrientation, setOriginalOrientation] = useState<ScreenOrientation.Orientation>();
  const back = require('@/assets/images/back.png');
  const db = useSQLiteContext();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [video, setVideo] = useState<any>(null);
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"));
  
  // References to track watch time that won't be affected by React's asynchronous updates
  const watchStartTimeRef = useRef<number | null>(null);
  const totalWatchTimeRef = useRef<number>(0);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const hasEndedRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      
      const videoId = parseInt(id);
      const dbVideo = await getVideoById(db, videoId);
      
      if (dbVideo) {
        setVideo(dbVideo);
        setFileUri(dbVideo.video_uri);
        setVideoSource(dbVideo.video_uri);
      }
    };

    fetchVideo();
  }, [id]);

  const player = useVideoPlayer(
    videoSource || '',
    async (player) => {
      if (!videoSource) return;
      
      player.loop = false;
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      setOriginalOrientation(currentOrientation);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      await player.play();
    }
  );

  // Listen for video end event
  useEffect(() => {
    if (!player) return;

    const checkVideoEnd = setInterval(() => {
      if (player.currentTime >= player.duration && player.duration > 0 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        returnBackToHome();
      }
    }, 100);

    return () => clearInterval(checkVideoEnd);
  }, [player]);

  // More reliable way to track watch time using refs
  useEffect(() => {
    const interval = setInterval(() => {
      if (player?.playing && watchStartTimeRef.current === null) {
        watchStartTimeRef.current = Date.now(); // Start tracking when video plays
      }
  
      if (!player?.playing && watchStartTimeRef.current !== null) {
        // Calculate time watched during this play segment
        const elapsedTime = Math.ceil((Date.now() - watchStartTimeRef.current) / 1000); // Convert to seconds
        // Add to total watch time using the ref (not state)
        totalWatchTimeRef.current += elapsedTime;
        watchStartTimeRef.current = null; // Reset for next play segment
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

const updateVideoAnalytics = async (
  watchedTime: number,
  options: { videoDuration?: number; completed?: boolean; watchedAt?: string } = {}
) => {
  if (!db || watchedTime <= 0) {
    return;
  }

  try {
    const users = await getUsers(db);
    if (users.length === 0) return;

    const userId = users[0].id;
    const parsedVideoId = id ? parseInt(id, 10) : Number(video?.id ?? 0);
    const videoId = Number.isNaN(parsedVideoId) ? Number(video?.id ?? 0) : parsedVideoId;
    if (!videoId) {
      console.warn("Unable to determine video ID for analytics update.");
      return;
    }

    const videoLang = language ?? video?.language ?? "en";
    const today = new Date().toISOString().split("T")[0];
    const watchedTimestamp = options.watchedAt ?? new Date().toISOString();

    console.log(
      `Updating analytics with: userId=${userId}, videoId=${videoId}, language=${videoLang}, watchedTime=${watchedTime}s`
    );

    const existingRecords = await db.getAllAsync(
      "SELECT * FROM video_analytics WHERE user_id = ? AND video_id = ? AND language = ? AND date = ?",
      [userId, videoId, videoLang, today]
    );

    if (existingRecords.length > 0) {
      await db.runAsync(
        `UPDATE video_analytics 
           SET total_views_day = total_views_day + 1, 
               total_time_day = total_time_day + ?, 
               last_time_stamp = ? 
           WHERE user_id = ? AND video_id = ? AND language = ? AND date = ?`,
        [watchedTime, watchedTimestamp, userId, videoId, videoLang, today]
      );
      console.log(`Updated analytics for Video ${videoId}, Language: ${videoLang} with ${watchedTime}s`);
    } else {
      await db.runAsync(
        `INSERT INTO video_analytics (user_id, video_id, date, total_views_day, total_time_day, last_time_stamp, language) 
           VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [userId, videoId, today, watchedTime, watchedTimestamp, videoLang]
      );
      console.log(`Inserted new analytics for Video ${videoId}, Language: ${videoLang} with ${watchedTime}s`);
    }

    try {
      await recordWatchSession(db, {
        userId,
        videoId,
        language: videoLang,
        watchTime: watchedTime,
        videoDuration: options.videoDuration ?? Math.round(player?.duration ?? 0),
        completed: options.completed ?? false,
        watchedAt: watchedTimestamp,
      });
    } catch (sessionError) {
      console.error("Error recording watch session:", sessionError);
    }
  } catch (error) {
    console.error("Error updating video analytics:", error);
  }
};
  
  const returnBackToHome = async () => {
    // Calculate final watch time including current playing segment if video is still playing
    let finalWatchTime = totalWatchTimeRef.current;
    
    if (player?.playing && watchStartTimeRef.current !== null) {
      // Add the current play segment if video is still playing
      finalWatchTime += (Math.ceil((Date.now() - watchStartTimeRef.current)/1000));
    }
    
    console.log(`Total Watch Time: ${finalWatchTime} seconds`);
    
    // Only update analytics if there's actual watch time
    if (finalWatchTime > 0) {
      const videoDurationSeconds = player?.duration ? Math.round(player.duration) : 0;
      const watchedAt = new Date().toISOString();
      const completionThreshold = videoDurationSeconds ? Math.max(videoDurationSeconds - 2, Math.ceil(videoDurationSeconds * 0.95)) : 0;
      const completed =
        videoDurationSeconds > 0 ? finalWatchTime >= completionThreshold : false;

      await updateVideoAnalytics(finalWatchTime, {
        videoDuration: videoDurationSeconds || finalWatchTime,
        completed,
        watchedAt,
      });
    }
  
    if (player) {
      player.pause();
    }
  
    if (originalOrientation) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    }
    
    // Return to home page instead of just going back
    router.replace("/(tabs)");
  };
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isLandscape = windowDimensions.width > windowDimensions.height;
  const videoContainerStyle = isLandscape
    ? styles.videoContainerLandscape
    : styles.videoContainerPortrait;

  return (
    <View style={styles.fullscreenContainer}>
      <TouchableOpacity
        className="absolute top-[43%] left-2 bg-white rounded-full p-2 z-10 shadow-lg shadow-black"
        onPress={returnBackToHome}
      >
        <Image className="w-8 h-8" source={back} />
      </TouchableOpacity>

      <View style={[styles.videoContainer, videoContainerStyle]}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
        />
      </View>
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
  videoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  videoContainerPortrait: {
    aspectRatio: 16 / 9,
    width: "100%",
    maxHeight: "100%",
  },
  videoContainerLandscape: {
    flex: 1,
    width: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "black",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
});