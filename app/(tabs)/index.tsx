import React from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { videoDetails } from "../../assets/details";
import { useRouter } from "expo-router";
const VideoList = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <FlatList
        data={videoDetails}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/video/${item.id}`)}>
            <View style={styles.card}>
              <Image source={item.thumbnail} style={styles.thumbnail} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  card: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
  },
  thumbnail: {
    width: 200,
    height: 120,
    borderRadius: 8,
    resizeMode: "cover",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
});

export default VideoList;
