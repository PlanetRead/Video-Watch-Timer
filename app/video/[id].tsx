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
  const totalWatchTimeRef = useRef<number>(0);
  const videoDurationRef = useRef<number>(0); // Store video duration
  const lastCurrentTimeRef = useRef<number>(0); // Store last known currentTime
  const playbackStartTimeRef = useRef<number | null>(null); // Track when playback actually started
  const lastSeekTimeRef = useRef<number>(0); // Track last seek position to detect seeking
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const hasEndedRef = useRef<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      
      // Reset watch time tracking refs for new video
      totalWatchTimeRef.current = 0;
      videoDurationRef.current = 0;
      lastCurrentTimeRef.current = 0;
      playbackStartTimeRef.current = null;
      lastSeekTimeRef.current = 0;
      hasEndedRef.current = false;
      setIsVideoReady(false);
      
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
      // Wait a bit for the video view to be ready before locking orientation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      setOriginalOrientation(currentOrientation);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      
      // Wait for orientation to be applied
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsVideoReady(true);
      await player.play();
    }
  );

  // Listen for video end event using the actual player position
  useEffect(() => {
    if (!player) return;

    const checkVideoEnd = setInterval(() => {
      try {
        const duration = player?.duration ?? 0;
        const currentTime = player?.currentTime ?? 0;

        // Mark as ended when we are effectively at the end of the video
        if (
          !hasEndedRef.current &&
          duration > 0 &&
          currentTime >= duration - 0.5 // allow small float inaccuracies
        ) {
          hasEndedRef.current = true;
          returnBackToHome();
        }
      } catch (error) {
        console.warn("Error while checking video end:", error);
      }
    }, 250);

    return () => clearInterval(checkVideoEnd);
  }, [player]);

  // Track watch time - track ONLY actual playback duration, not video position
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      try {
        // Safely get player properties
        const currentTime = player?.currentTime ? Math.floor(player.currentTime) : 0;
        const duration = player?.duration ? Math.floor(player.duration) : 0;
        const isPlaying = player?.playing || false;
        
        // Store duration in refs for later use
        if (duration > 0) {
          videoDurationRef.current = duration;
        }
        
        // Detect seeking - if currentTime jumps significantly, user sought to a different position
        const timeDiff = Math.abs(currentTime - lastCurrentTimeRef.current);
        if (timeDiff > 2 && lastCurrentTimeRef.current > 0) {
          // User sought - save the time watched so far, then reset for new position
          if (playbackStartTimeRef.current !== null) {
            const playbackDuration = (Date.now() - playbackStartTimeRef.current) / 1000;
            // Add only the actual time watched (not the position)
            totalWatchTimeRef.current += Math.floor(playbackDuration);
          }
          // Reset playback tracking for new position
          playbackStartTimeRef.current = isPlaying ? Date.now() : null;
          lastSeekTimeRef.current = currentTime;
        }
        
        // Track actual playback time - only count time video was playing
        if (isPlaying) {
          // If playback just started, record the start time
          if (playbackStartTimeRef.current === null) {
            playbackStartTimeRef.current = Date.now();
            lastSeekTimeRef.current = currentTime;
          }
          // Don't update totalWatchTimeRef here - we'll calculate it when playback stops or seeks
        } else {
          // Video paused - save the time watched during this playback segment
          if (playbackStartTimeRef.current !== null) {
            const playbackDuration = (Date.now() - playbackStartTimeRef.current) / 1000;
            // Add only the actual playback duration (time watched), not the position
            totalWatchTimeRef.current += Math.floor(playbackDuration);
            playbackStartTimeRef.current = null;
          }
        }
        
        lastCurrentTimeRef.current = currentTime;
      } catch (error) {
        // Player might be released, use stored refs
        console.warn("Error accessing player properties:", error);
      }
    }, 500); // Check every 500ms for more accurate tracking
  
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
  if (!db) {
    return;
  }
  
  // Allow 0 watch time to be recorded (at least record the view)
  if (watchedTime < 0) {
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
        videoDuration: options.videoDuration ?? Math.round(videoDurationRef.current || 0),
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
    // Calculate final watch time from actual playback tracking
    let finalWatchTime = totalWatchTimeRef.current;
    let playerCurrentTime = lastCurrentTimeRef.current;
    let playerDuration = videoDurationRef.current;
    
    // If video is still playing, add the final playback segment time
    try {
      if (player && playbackStartTimeRef.current !== null && player.playing) {
        const playbackDuration = (Date.now() - playbackStartTimeRef.current) / 1000;
        // Add only the actual playback duration, not the position
        finalWatchTime += Math.floor(playbackDuration);
      }
      
      if (player) {
        const currentTime = player.currentTime ? Math.floor(player.currentTime) : 0;
        const duration = player.duration ? Math.floor(player.duration) : 0;
        
        if (currentTime > 0) {
          playerCurrentTime = currentTime;
        }
        if (duration > 0) {
          playerDuration = duration;
        }
      }
    } catch (error) {
      // Player might be released, use stored refs
      console.warn("Player may be released, using stored values:", error);
    }
    
    // Cap watch time at video duration (can't watch more than the video length)
    if (playerDuration > 0) {
      finalWatchTime = Math.min(finalWatchTime, playerDuration);
    }
    
    // Only record if there's actual watch time
    if (finalWatchTime <= 0) {
      // If no watch time tracked, don't record anything
      // This handles the case where user seeks to end but doesn't actually watch
      console.log(`No watch time recorded - user didn't actually watch the video`);
    } else {
      console.log(`Total Watch Time: ${finalWatchTime} seconds, Stored currentTime: ${playerCurrentTime}, Stored duration: ${playerDuration}`);
      
      // Update analytics only if there's actual watch time
      const videoDurationSeconds = playerDuration > 0 ? playerDuration : 0;
      const watchedAt = new Date().toISOString();

      // Mark video as completed if watch time is within 1 second of total video duration
      // This means: (videoDuration - watchTime) <= 1 second
      const completed = videoDurationSeconds > 0 
        ? (videoDurationSeconds - finalWatchTime) <= 1 
        : false;

      await updateVideoAnalytics(finalWatchTime, {
        videoDuration: videoDurationSeconds || finalWatchTime,
        completed,
        watchedAt,
      });
    }
  
    if (player) {
      player.pause();
    }
  
    // Restore orientation and wait for it to complete before navigating
    if (originalOrientation) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
      // Wait for orientation to be restored
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Wait a bit more to ensure player is fully stopped
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return to home page using back navigation to preserve stack
    try {
      router.back();
    } catch (error) {
      // Fallback to replace if back navigation fails
      router.replace("/(tabs)");
    }
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
          nativeControls={true}
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