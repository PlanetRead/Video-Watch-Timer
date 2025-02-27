import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { videoDetails } from "../../assets/details";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import * as Application from 'expo-application';
import { Platform } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const gov_logo = require('@/assets/images/gov_logo.png');
const billion_readers = require('@/assets/images/billion_readers.png');
const translate_img = require('@/assets/images/translate.png');
const pdf_img = require('@/assets/images/pdf.png');

const getDeviceId = async () => {
  if (Platform.OS === 'android') {
    // for SDK < 50
    // return Application.androidId;

    return Application.getAndroidId();

  } else {
    let deviceId = await SecureStore.getItemAsync('deviceId');

    if (!deviceId) {
      deviceId = Constants.deviceId; //or generate uuid
      if (deviceId) await SecureStore.setItemAsync('deviceId', deviceId);
    }

    return deviceId;
  }
}

console.log(getDeviceId());

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

  // Load saved languages when component mounts
  useEffect(() => {
    const loadLanguages = async () => {
      const savedLanguages = await AsyncStorage.getItem('videoLanguages');
      if (savedLanguages) {
        setVideoLanguages(JSON.parse(savedLanguages));
      }
    };
    loadLanguages();
  }, []);

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
    setVideoLanguages((prev) => {
      const updated = { ...prev, [videoId]: prev[videoId] === "en" ? "pa" : "en" };
      AsyncStorage.setItem('videoLanguages', JSON.stringify(updated)); // Save state
      return updated;
    });
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
      <View className="flex flex-row p-4 items-center mt-12 justify-evenly gap-3">
        <TouchableOpacity className="" onPress={() => router.push(`/login`)}>
          <Image source={gov_logo} className="w-[50px] h-[60px] flex-1"
            style={{ resizeMode: "contain" }} />
        </TouchableOpacity>
        <DropDownPicker
          open={open}
          value={language}
          items={items}
          setOpen={(val) => {
            setOpen(val);
            if (levelOpen) setLevelOpen(false);
          }}
          setValue={handleLanguageChange}
          containerStyle={{ maxWidth: 95, paddingVertical: 0, flex: 2, paddingHorizontal: 0 }}
          textStyle={{ fontSize: 12 }}
          arrowIconStyle={{ marginHorizontal: -5 }}
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
          textStyle={{ fontSize: 12 }}
          arrowIconStyle={{ marginHorizontal: -5 }}
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
            <View className="flex flex-row items-center justify-between p-4 border-b-[1px] border-gray-300 h-fit min-h-[130px]">
              <TouchableOpacity
                className="w-1/2"
                onPress={() => handleVideoPress(item)}
              >
                <Image
                  source={videoLanguages[item.id] === "en" ? item.thumbnail_en : item.thumbnail_punjabi}
                  className="h-[100px] w-full"
                  style={styles.thumbnail}
                />
              </TouchableOpacity>

              {/* Video Details along with pdf and translation option */}
              <View className="flex w-1/2 px-4 justify-between items-start gap-2 min-h-[100px]">
                <Text className="text-white text-left text-2xl w-full font-bold break-words">
                  {videoLanguages[item.id] === "en" ? item.english_title : item.punjabi_title}
                </Text>
                <View className="flex gap-2 flex-row">
                  <TouchableOpacity
                    onPress={() => toggleVideoLanguage(item.id)}
                    className="bg-white p-2 rounded-full">
                    <Image className="w-6 h-6" source={translate_img} style={{ tintColor: 'black' }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push(`/pdf/${item.id}?language=${videoLanguages[item.id]}`)}
                    className="bg-white p-2 rounded-full">
                    <Image className="w-6 h-6" source={pdf_img} style={{ tintColor: 'black' }} />
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
    resizeMode: "contain",
  },
});

export default VideoList;