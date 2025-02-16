import React, { useState } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { videoDetails } from "../../assets/details";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";

const gov_logo = require('@/assets/images/gov_logo.png');
const billion_readers = require('@/assets/images/billion_readers.png');
const VideoList = () => {
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "pa" : "en"));
  };

  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [items, setItems] = useState([
    { label: "English", value: "en" },
    { label: "Punjabi", value: "pa" },
  ]);

  const [levelOpen, setLevelOpen] = useState(false);
  const [level, setLevel] = useState("all");
  const [levels, setLevels] = useState([
    { label: "All Levels", value: "all" },
    { label: "Level 1", value: "1" },
    { label: "Level 2", value: "2" },
    { label: "Level 3", value: "3" },
  ]);

  return (
    <View className="bg-purple-700 h-full">
      <View className="flex flex-row justify-between p-4 items-center mt-12">
        <Image source={gov_logo} className="w-[50px] h-[50px]" />

          <DropDownPicker
            open={open}
            value={language}
            items={items}
            setOpen={(val) => {
              setOpen(val);
              if (levelOpen) setLevelOpen(false);
            }}
            setValue={setLanguage}
            setItems={setItems}
            containerStyle={{ width: 100, paddingVertical: 0 }}
          />
          <DropDownPicker
            open={levelOpen}
            value={level}
            items={levels}
            setOpen={(val) => {
              setLevelOpen(val);
              if (open) setOpen(false);
            }}
            setValue={setLevel}
            setItems={setLevels}
            containerStyle={{ width: 100, paddingVertical: 0 }}
          />

        <Image source={billion_readers} className="w-[50px] h-[50px]" />
      </View>
      <View>

        <FlatList
          className="overflow-y-scroll"
          data={videoDetails.filter(item => level === "all" || item.level === level)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/video/${item.id}?language=${language}`)}>
              <View className="flex flex-row items-center justify-between p-4 border-bottom border-b-[1px] border-gray-300">
                <Image source={language === "en" ? item.thumbnail_en : item.thumbnail_punjabi} className="w-1/2 h-[110px]" style={styles.thumbnail} />
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
