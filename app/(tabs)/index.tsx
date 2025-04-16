import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, AppStateStatus } from "react-native";
import { videoDetails } from "../../assets/details";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsers, createUser, deleteUser, checkSchema } from "../database/database";
import { useSQLiteContext } from "expo-sqlite";
import * as Application from 'expo-application';
import { Platform } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useUser } from "../userContext";
import { AppState } from "react-native";
import { useTheme } from "../themeContext";
import ThemeToggle from "../../components/ThemeToggle";

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

const VideoList = () => {
  const router = useRouter();
  const db = useSQLiteContext();
  const { role, setRole } = useUser();
  const { isDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
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
      const savedLanguage = await AsyncStorage.getItem('languageDropdown');
      if (savedLanguage) {
        setLanguage(savedLanguage);
        // const newVideoLanguages: VideoLanguages = {};
        // videoDetails.forEach((item) => {
        //   newVideoLanguages[item.id] = savedLanguage;
        // }
        // );
        // setVideoLanguages(newVideoLanguages);
      }
      const savedLanguages = await AsyncStorage.getItem('videoLanguages');
      if (savedLanguages) {
        setVideoLanguages(JSON.parse(savedLanguages));
      }
      const savedLevel = await AsyncStorage.getItem('levelDropdown');
      if (savedLevel) {
        setLevel(savedLevel);
      }
      setLoading(false);
    };
    loadLanguages();
  }, []);


  // Reset languages when app goes into the background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        const resetLanguages = Object.fromEntries(videoDetails.map((item) => [item.id, "en"]));
        const resetLevel = Object.fromEntries(videoDetails.map((item) => [item.id, "all"]));
        // console.log("Resetting languages to default:", resetLevel);
        setVideoLanguages(resetLanguages);
        setLevel("all");
        setLanguage("en");
        await AsyncStorage.setItem("videoLanguages", JSON.stringify(resetLanguages));
        await AsyncStorage.setItem("levelDropdown", "all");
        await AsyncStorage.setItem('languageDropdown', "en");
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);


  useEffect(() => {
    const initializeUser = async () => {
      try {
        const deviceId = await getDeviceId(); // Fetch device ID properly
        if (!deviceId) return;
        const users = await getUsers(db);
        if (users.length === 0) {
          await createUser(db, deviceId, role, 2005); // need to check the pin
          // console.log(deviceId);
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };

    initializeUser();

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
    console.log("Selected Language:", newValue);
    AsyncStorage.setItem('languageDropdown', newValue);
    const newVideoLanguages: VideoLanguages = {};
    videoDetails.forEach((item) => {
      newVideoLanguages[item.id] = newValue;
    });
    setVideoLanguages(newVideoLanguages);
  };

  const handleLevelChange = (callback: (prevValue: string) => string) => {
    const newValue = callback(level);
    setLevel(newValue);
    AsyncStorage.setItem('levelDropdown', newValue);
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
    <View className={`flex-1 ${isDarkMode ? 'bg-background-dark' : 'bg-purple-700'}`}>
      <View className="flex flex-row justify-between px-4 py-6 items-center mt-10 gap-3">
        <Image source={gov_logo} className="w-[100px] h-[70px] flex-1"
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
          style={{
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            width: 112,
            height: 40,
            zIndex: 20
          }}
          textStyle={{
            color: isDarkMode ? '#F3F4F6' : '#1F2937',
          }}
          dropDownContainerStyle={{
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          }}
          theme={isDarkMode ? "DARK" : "LIGHT"}
        />
        <View className="flex flex-row items-center">
          <ThemeToggle showLabel={false} size={20} containerStyle={{ marginRight: 8 }} />
          <Image source={billion_readers} className="w-[120px] h-[70px]"
            style={{ resizeMode: "contain" }} />
        </View>
      </View>

      <View className="flex flex-row justify-between px-4 items-center mb-5">
        <Text className={`text-lg font-bold ${isDarkMode ? 'text-text-dark' : 'text-white'}`}>
          Watch and Learn
        </Text>

        <DropDownPicker
          open={levelOpen}
          value={level}
          items={levels}
          setOpen={(val) => {
            setLevelOpen(val);
            if (open) setOpen(false);
          }}
          setValue={handleLevelChange}
          style={{
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            width: 112,
            height: 40,
            zIndex: 10
          }}
          textStyle={{
            color: isDarkMode ? '#F3F4F6' : '#1F2937',
          }}
          dropDownContainerStyle={{
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          }}
          theme={isDarkMode ? "DARK" : "LIGHT"}
        />
      </View>

      <View className="px-4 mt-2 pb-24">
        <FlatList
          data={level === "all" ? videoDetails : videoDetails.filter(item => item.level === level)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 20 }}
          renderItem={({ item }) => {
            const isEnglish = videoLanguages[item.id] === "en";
            return (
              <View className={`w-[48%] rounded-xl overflow-hidden ${isDarkMode ? 'bg-surface-dark' : 'bg-white'}`}>

                <TouchableOpacity onPress={() => handleVideoPress(item)}>
                  <Image
                    source={isEnglish ? item.thumbnail_en : item.thumbnail_punjabi}
                    className="w-full h-32"
                    style={{ resizeMode: "cover" }}
                  />
                </TouchableOpacity>

                <View className="p-2">
                  <Text className={`font-semibold ${isDarkMode ? 'text-text-dark' : 'text-gray-800'}`} numberOfLines={2}>
                    {isEnglish ? item.english_title : item.punjabi_title}
                  </Text>

                  <View className="flex flex-row justify-between mt-2">
                    <TouchableOpacity
                      onPress={() => toggleVideoLanguage(item.id)}
                      className="bg-purple-600 p-2 rounded-md"
                    >
                      <Image source={translate_img} className="w-5 h-5" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handlePdfPress(item)}
                      className="bg-purple-600 p-2 rounded-md"
                    >
                      <Image source={pdf_img} className="w-5 h-5" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
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