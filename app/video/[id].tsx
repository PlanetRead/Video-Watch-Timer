import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { videoDetails } from "@/assets/details";
import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useRouter } from "expo-router";
import { useKeepAwake } from 'expo-keep-awake';
import { useEventListener } from "expo";


export default function VideoScreen() {
  useKeepAwake();
  const router = useRouter();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  const [originalOrientation, setOriginalOrientation] = useState<ScreenOrientation.Orientation>();
  const back = require('@/assets/images/back.png');
  const video = videoDetails.find((v) => v.id === id);

  if (!video) {
    return (
      <View>
        <Text style={styles.errorText}>Video not found</Text>
      </View>
    );
  }

  const player = useVideoPlayer(
    language === "pa" ? video.url_punjabi : video.url_en,
    async (player) => {
      player.loop = true;

      // Store the original orientation before changing
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      setOriginalOrientation(currentOrientation);

      // Change to landscape mode automatically
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

      await player.play();
    }
  );

  // Restore original orientation when exiting
  useEffect(() => {
    return () => {
      if (originalOrientation) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
      }
    };
  }, [originalOrientation]);

  useEffect(() => {
    // Video Title
    console.log(`Video Title: ${video.english_title}`);

    // Update the view count
    console.log("View Count ++");

    // Update the view count based on the language
    if (language === 'pa') {
      console.log("Punjabi View Count ++");
    }
    else {
      console.log("English View Count ++");
    }

  }, []);

  const returnBackToHome = () => {

    // Get the watched time
    const watchedTime = Math.floor(player.currentTime);
    console.log(`Watched Till: ${watchedTime} seconds`);
    console.log(`Update Watch Time in DB by ${watchedTime} seconds`);

    if (player) {
      player.pause();
    }

    if (originalOrientation) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
    }
    router.push(`/`);
  }

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
    padding: 0,
    objectFit: 'contain',
    paddingBottom: 15
  },
  video: {
    width: "100%",
    height: "110%",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
});
