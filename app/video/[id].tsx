import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text, TouchableOpacity, Image, TouchableWithoutFeedback } from "react-native";
import { videoDetails } from "@/assets/details";
import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useRouter } from "expo-router";
import { useKeepAwake } from 'expo-keep-awake';
import { useSQLiteContext } from "expo-sqlite";
import { getVideoAnalyticsByUser, getUsers } from "../database/database";
import { getVideoUri } from "./videoDownlaoder";
import { BackHandler } from "react-native";
import { useTheme } from "../themeContext";

export default function VideoScreen() {
  useKeepAwake();
  const router = useRouter();
  const { isDark } = useTheme();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  const [originalOrientation, setOriginalOrientation] = useState<ScreenOrientation.Orientation>();
  const back = require('@/assets/images/back.png');
  const video = videoDetails.find((v) => v.id === id);
  const db = useSQLiteContext();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const videoUri = `${video?.id}_${language == "pa" ? "pa" : "en"}`;

  useEffect(() => {
    const fetchVideoUri = async () => {
      const uri = await getVideoUri(videoUri);
      setFileUri(uri);
      
      if (uri && video) {
        setVideoSource(uri);
      }
    };

    fetchVideoUri();
  }, []);
  const handlePress = () => {
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

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
  
  useEffect(() => {
    const backAction = () => {
      returnBackToHome();
      return true;
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
  
    return () => backHandler.remove();
  }, [player, originalOrientation, router]);

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
      const userId = users[0].id
      const videoId = parseInt(id ?? "0");
      const videoLang = language ?? "en";
      const today = new Date().toISOString().split("T")[0];
      const lastWatchedTimestamp = new Date().toISOString();

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
          [watchedTime, lastWatchedTimestamp, userId, videoId, videoLang, today]
        );
      } else {
        await db.runAsync(
          `INSERT INTO video_analytics (user_id, video_id, date, total_views_day, total_time_day, last_time_stamp, language) 
           VALUES (?, ?, ?, 1, ?, ?, ?)`,
          [userId, videoId, today, watchedTime, lastWatchedTimestamp, videoLang]
        );
      }
    } catch (error) {
      console.error("Error updating video analytics:", error);
    }
  };
  

  const returnBackToHome = async () => {
    const watchedTime = Math.floor(player.currentTime);
  
    await updateVideoAnalytics(watchedTime);
  
    if (player) {
      player.pause();
    }
  
    if (originalOrientation) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    }
    router.push(`/`);
  };
  
  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.fullscreenContainer} className={isDark ? 'bg-black' : 'bg-white'}>
        <TouchableOpacity
          className={`absolute top-[43%] left-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full p-2 z-10 shadow-lg shadow-black`}
          onPress={returnBackToHome}
        >
          <Image className="w-8 h-8" source={back} style={{tintColor: isDark ? '#FFFFFF' : '#000000'}} />
        </TouchableOpacity>

        {showControls && (
          <View className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center z-10">
            <View className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} opacity-80`}>
              <Text className={`${isDark ? 'text-white' : 'text-black'} font-bold text-lg`}>
                {language === "en" ? video?.english_title : video?.punjabi_title}
              </Text>
            </View>
          </View>
        )}

        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: 'black',
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
});

