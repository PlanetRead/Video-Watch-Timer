import { useLocalSearchParams } from "expo-router";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Button, Text } from "react-native";
import { videoDetails } from '@/assets/details';

export default function VideoScreen() {
  const { id } = useLocalSearchParams();

  // Find video by ID
  const video = videoDetails.find((v) => v.id === id);

  // Handle case where video is not found
  if (!video) {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.errorText}>Video not found</Text>
      </View>
    );
  }

  // Create video player
  const player = useVideoPlayer(video.url, (player) => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

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

