import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Button, Text } from "react-native";
import { videoDetails } from '@/assets/details';

export default function VideoScreen() {

  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();

  const video = videoDetails.find((v) => v.id === id);

  if (!video) {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.errorText}>Video not found</Text>
      </View>
    );
  }

  const player = useVideoPlayer(
    language === "pa" ? video.url_punjabi : video.url_en,
    (player) => {
      player.loop = true;
      player.play();
    }
  );


  return (
    <View style={styles.contentContainer}>
      <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  video: {
    width: 350,
    height: 275,
  },
  controlsContainer: {
    padding: 10,
  },
  description: {
    fontSize: 16,
    marginTop: 10,
    color: "#555",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
});

