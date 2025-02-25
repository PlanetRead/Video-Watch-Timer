import React, { useState } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { videoDetails } from "../../assets/details";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { WebView } from 'react-native-webview';


const gov_logo = require('@/assets/images/gov_logo.png');
const billion_readers = require('@/assets/images/billion_readers.png');
const translate_img = require('@/assets/images/translate.png');
const pdf_img = require('@/assets/images/pdf.png');

interface VideoItem {
  id: string;
  english_title: string;
  punjabi_title: string;
  thumbnail_en: any; 
  thumbnail_punjabi: any;
  level: string;
}

interface VideoLanguages {
  [key: string]: string;
}

const VideoList = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [items] = useState([
    { label: "English", value: "en" },
    { label: "Punjabi", value: "pa" },
  ]);

  const [videoLanguages, setVideoLanguages] = useState(
    Object.fromEntries(videoDetails.map((item) => [item.id, "en"]))
  );

  const [levelOpen, setLevelOpen] = useState(false);
  const [level, setLevel] = useState("all");
  const [levels] = useState([
    { label: "All Levels", value: "all" },
    { label: "Level 1", value: "1" },
    { label: "Level 2", value: "2" },
    { label: "Level 3", value: "3" },
    { label: "Level 4", value: "4" },
  ]);

  const handleLanguageChange = (callback: (prevValue: string) => string) => {
    const newValue = callback(language);
    setLanguage(newValue);
    const newVideoLanguages: VideoLanguages = {};
    videoDetails.forEach((item) => {
      newVideoLanguages[item.id] = newValue;
    });
    setVideoLanguages(newVideoLanguages);
  };

  const toggleVideoLanguage = (videoId: string) => {
    setVideoLanguages((prev) => ({
      ...prev,
      [videoId]: prev[videoId] === "en" ? "pa" : "en",
    }));
  };

  const handleVideoPress = (item: VideoItem) => {
    const itemLanguage = videoLanguages[item.id];
    router.push(`/video/${item.id}?language=${itemLanguage}`);
  };

  const handlePdfPress = (item: VideoItem) => {
    const itemLanguage = videoLanguages[item.id];
    router.push(`/pdf/${item.id}?language=${itemLanguage}`);
  };

  return (
    <View className="bg-purple-700 h-full flex-1">
      <View className="flex flex-row justify-between p-4 items-center mt-12 gap-4">
        <Image source={gov_logo} className="w-[50px] h-[60px] flex-1"
          style={{ resizeMode: "contain" }} />
        <DropDownPicker
          open={open}
          value={language}
          items={items}
          setOpen={(val) => {
            setOpen(val);
            if (levelOpen) setLevelOpen(false);
          }}
          setValue={handleLanguageChange}
          containerStyle={{ maxWidth: 100, paddingVertical: 0, flex: 2, paddingHorizontal: 0 }}
          textStyle={{ fontSize: 13 }}
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
          containerStyle={{ maxWidth: 100, paddingVertical: 0, flex: 2, paddingHorizontal: 0 }}
          textStyle={{ fontSize: 13 }}
        />

<Image source={billion_readers} className="w-[50px] h-[50px] flex-1"
          style={{ resizeMode: "contain" }} />
      </View>

      <View>
        <FlatList
          contentContainerStyle={{ paddingBottom: 140 }}
          data={videoDetails.filter(item => level === "all" || item.level === level)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex flex-row items-center justify-between p-4 border-b-[1px] border-gray-300 min-h-[150px]">
              <TouchableOpacity
                className="w-1/2"
                onPress={() => handleVideoPress(item)}
              >
                <Image
                  source={videoLanguages[item.id] === "en" ? item.thumbnail_en : item.thumbnail_punjabi}
                  className="h-[110px] w-full"
                  style={styles.thumbnail}
                />
              </TouchableOpacity>

            {/* Video Details along with pdf and translation option */}
              <View className="flex w-1/2 justify-start items-start p-4 gap-2">
                <Text className="text-white text-left text-2xl w-full font-bold break-words">
                  {videoLanguages[item.id] === "en" ? item.english_title : item.punjabi_title}
                </Text>
                <View className="flex gap-2 flex-row">
                <TouchableOpacity
                  onPress={() => toggleVideoLanguage(item.id)}
                  className="bg-white p-2 rounded-full">
                  <Image className="w-6 h-6" source={translate_img} style={{tintColor: 'black'}} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/pdf/${item.id}?language=${videoLanguages[item.id]}`)}
                  className="bg-white p-2 rounded-full">
                  <Image className="w-6 h-6" source={pdf_img} style={{tintColor: 'black'}} />
                </TouchableOpacity>
                </View>
              </View>
              </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    resizeMode: "cover",
    borderRadius: 8,
  },
});

export default VideoList;