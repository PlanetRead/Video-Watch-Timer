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
import { useTheme } from "../themeContext";
import ThemeToggle from "@/components/ThemeToggle";
import { AppState } from "react-native";
import { Ionicons } from '@expo/vector-icons';

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
  const { isDark } = useTheme();
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
      const savedLevel = await AsyncStorage.getItem('levelDropdown');
      if (savedLevel) {
        setLevel(savedLevel);
      }
    };
    loadLanguages();
  }, []);


  // Reset languages when app goes into the background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        const resetLanguages = Object.fromEntries(videoDetails.map((item) => [item.id, "en"]));
        const resetLevel = Object.fromEntries(videoDetails.map((item) => [item.id, "all"]));
        setVideoLanguages(resetLanguages);
        setLevel("all");
        await AsyncStorage.setItem("videoLanguages", JSON.stringify(resetLanguages));
        await AsyncStorage.setItem("levelDropdown", "all");
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
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-purple-700'}`}>
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
          containerStyle={{ maxWidth: 100, paddingVertical: 0, paddingHorizontal: 0, flex: 1.6 }}
          style={{ 
            height: 40, 
            minHeight: 30,
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
          }}
          textStyle={{ 
            fontSize: 11,
            color: isDark ? '#F9FAFB' : '#1F2937',
          }}
          arrowIconStyle={{ marginHorizontal: -5 }}
          theme={isDark ? "DARK" : "LIGHT"}
        />
        <DropDownPicker
          open={levelOpen}
          value={level}
          items={levels}
          setOpen={(val) => {
            setLevelOpen(val);
            if (open) setOpen(false);
          }}
          setValue={handleLevelChange}
          containerStyle={{ maxWidth: 100, paddingVertical: 0, flex: 2, paddingHorizontal: 0 }}
          style={{ 
            height: 40, 
            minHeight: 30,
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
          }}
          textStyle={{ 
            fontSize: 11,
            color: isDark ? '#F9FAFB' : '#1F2937',
          }}
          arrowIconStyle={{ marginHorizontal: -5 }}
          theme={isDark ? "DARK" : "LIGHT"}
        />
        <View className="flex-row items-center flex-1 justify-between">
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            <Ionicons name="settings-outline" size={20} color={isDark ? "#A78BFA" : "#8B5CF6"} />
          </TouchableOpacity>
          <ThemeToggle />
          <TouchableOpacity className="w-[75px] h-[70px]" onLongPress={() => router.push(`/login`)} delayLongPress={5000}>
            <Image source={billion_readers} className="w-full h-full"
              style={{ resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
      </View>


      <View>
        <FlatList
          contentContainerStyle={{ paddingBottom: 140 }}
          data={videoDetails.filter(item => level === "all" || item.level === level)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className={`flex flex-row items-center justify-between p-2 border-b-[1px] ${isDark ? 'border-gray-700' : 'border-gray-300'} h-fit min-h-[130px]`}>
              <TouchableOpacity
                className="w-[45%]"
                onPress={() => handleVideoPress(item)}
              >
                <Image
                  source={videoLanguages[item.id] === "en" ? item.thumbnail_en : item.thumbnail_punjabi}
                  className="h-[100px] w-full"
                  style={styles.thumbnail}
                />
              </TouchableOpacity>

              {/* Video Details along with pdf and translation option */}
              <View className="flex w-[55%] pl-2 justify-between items-start h-[97px]">
                <Text className={`text-left text-xl w-full font-bold break-words ${isDark ? 'text-white' : 'text-white'}`}>
                  {videoLanguages[item.id] === "en" ? item.english_title : item.punjabi_title}
                </Text>
                <View className="flex gap-2 flex-row">
                  <TouchableOpacity
                    onPress={() => toggleVideoLanguage(item.id)}
                    className={`p-2.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <Image className="w-6 h-6" source={translate_img} style={{ tintColor: isDark ? '#F9FAFB' : 'black' }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={()=>handlePdfPress(item)}
                    className={`p-2.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <Image className="w-6 h-6" source={pdf_img} style={{ tintColor: isDark ? '#F9FAFB' : 'black' }} />
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