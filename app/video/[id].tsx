import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text } from "react-native";
import { videoDetails } from "@/assets/details";
import { useEffect, useState } from "react";
import * as ScreenOrientation from "expo-screen-orientation";

export default function VideoScreen() {
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  const [originalOrientation, setOriginalOrientation] = useState<ScreenOrientation.Orientation>();

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

  return (
    <View style={styles.fullscreenContainer}>
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
    height: "100%",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
});
