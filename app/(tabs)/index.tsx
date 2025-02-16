import React, { useState } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { videoDetails } from "../../assets/details";
import { useRouter } from "expo-router";

const gov_logo = require('@/assets/images/gov_logo.png');
const billion_readers = require('@/assets/images/billion_readers.png');
const VideoList = () => {
  const router = useRouter();
  const [language, setLanguage] = useState("en");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "pa" : "en"));
  };

  return (
    <View className="bg-purple-700 h-full">
      <View className="flex flex-row justify-between p-4 items-center mt-12">
        <Image source={gov_logo} className="w-[50px] h-[50px]" />
        <TouchableOpacity onPress={toggleLanguage} className="bg-white p-2 rounded-md">
          <Text>{language === "en" ? "English" : "Punjabi"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleLanguage} className="bg-white p-2 rounded-md">
          <Text>Levels</Text>
        </TouchableOpacity>
        <Image source={billion_readers} className="w-[50px] h-[50px]" />
      </View>
      <View>

        <FlatList
          className="overflow-y-scroll"
          data={videoDetails}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/video/${item.id}?language=${language}`)}>
              <View className="flex flex-row items-center justify-between p-4 border-bottom border-b-[1px] border-gray-300">
                <Image source={language === "en" ? item.thumbnail_en : item.thumbnail_punjabi } className="w-1/2 h-[110px]" style={styles.thumbnail} />
                <View className="flex w-1/2 justify-start items-start p-4">
                  <Text className="text-white text-left text-2xl font-semibold break-words">
                    {language === "en" ? item.english_title : item.punjabi_title}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    resizeMode: "cover",
  }
});

export default VideoList;
