import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, AppStateStatus } from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsers, createUser, deleteUser, checkSchema, getAllVideos, Video } from "../database/database";
import { useSQLiteContext } from "expo-sqlite";
import * as Application from 'expo-application';
import { Platform } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useUser } from "../userContext";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const gov_logo = require('@/assets/images/gov_logo.png');
const billion_readers = require('@/assets/images/billion_readers.png');
const translate_img = require('@/assets/images/translate.png');
const pdf_img = require('@/assets/images/pdf.png');


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
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [items] = useState([
    { label: "English", value: "en" },
    { label: "Hindi", value: "hi" },
  ]);

  const [videoLanguages, setVideoLanguages] = useState<VideoLanguages>({});

  // Load videos from database
  const loadVideos = async () => {
    try {
      const dbVideos = await getAllVideos(db);
      setVideos(dbVideos);
      
      // Initialize video languages
      const languages: VideoLanguages = {};
      dbVideos.forEach((video) => {
        languages[video.id.toString()] = video.language;
      });
      setVideoLanguages(languages);
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  // Load saved languages when component mounts
  useEffect(() => {
    const loadLanguages = async () => {
      const savedLanguage = await AsyncStorage.getItem('languageDropdown');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
      const savedLanguages = await AsyncStorage.getItem('videoLanguages');
      if (savedLanguages) {
        setVideoLanguages(JSON.parse(savedLanguages));
      }
      const savedLevel = await AsyncStorage.getItem('levelDropdown');
      if (savedLevel) {
        setLevel(savedLevel);
      }
      await loadVideos();
      setLoading(false);
    };
    loadLanguages();
  }, []);

  // Reload videos when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadVideos();
    }, [])
  );


  // Reset languages when app goes into the background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        const resetLanguages: VideoLanguages = {};
        videos.forEach((video) => {
          resetLanguages[video.id.toString()] = video.language;
        });
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
  }, [videos]);


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

  const handleLanguageChange = (value: ((prevValue: string) => string) | string) => {
    const newValue = typeof value === "function" ? value(language) : value;
    setLanguage(newValue);
    AsyncStorage.setItem('languageDropdown', newValue);
  };

  const handleLevelChange = (value: ((prevValue: string) => string) | string) => {
    const newValue = typeof value === "function" ? value(level) : value;
    setLevel(newValue);
    AsyncStorage.setItem('levelDropdown', newValue);
  };


  const toggleVideoLanguage = (videoId: string) => {
    setVideoLanguages((prev) => {
      const updated = { ...prev, [videoId]: prev[videoId] === "en" ? "hi" : "en" };
      AsyncStorage.setItem('videoLanguages', JSON.stringify(updated)); // Save state
      return updated;
    });
  };

  const handleVideoPress = (video: Video) => {
    const itemLanguage = videoLanguages[video.id.toString()] || video.language;
    router.push(`/video/${video.id}?language=${itemLanguage}`);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesLevel = level === "all" || video.level === level;
    const videoLang = video.language || "en";
    const matchesLanguage = language ? videoLang === language : true;
    return matchesLevel && matchesLanguage;
  });

  return (
    <View className="bg-purple-700 h-full flex-1">

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
          style={{ height: 40, minHeight: 30 }}
          textStyle={{ fontSize: 11 }}
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
          setValue={handleLevelChange}
          containerStyle={{ maxWidth: 100, paddingVertical: 0, flex: 2, paddingHorizontal: 0 }}
          style={{ height: 40, minHeight: 30 }}
          textStyle={{ fontSize: 11 }}
          arrowIconStyle={{ marginHorizontal: -5 }}
        />
        <TouchableOpacity className="w-[100px] h-[70px] flex-1" onLongPress={() => router.navigate(`/login`)} delayLongPress={5000}>
          <Image source={billion_readers} className="w-full h-full"
            style={{ resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>

      {
  loading ? (
    <FlatList
      data={[1, 2, 3, 4]}
      keyExtractor={(item) => item.toString()}
      renderItem={() => (
        <View className="flex flex-row justify-between p-4 border-b-[1px] border-gray-100 h-[130px]">
          <View className="bg-gray-100 w-[45%] h-[100px] rounded" />
          <View className="w-[50%] pl-2 justify-between">
            <View className="bg-gray-100 h-5 w-3/4 rounded mb-2" />
            <View className="bg-gray-100 h-5 w-1/2 rounded" />
          </View>
        </View>
      )}
    />
  ) : videos.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-white text-xl font-bold text-center mb-4">
            No videos available
          </Text>
          <Text className="text-white text-center opacity-80">
            Please log in as admin to upload videos
          </Text>
        </View>
      ) : (
        <View>
          <FlatList
            contentContainerStyle={{ paddingBottom: 140 }}
            data={filteredVideos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const itemLanguage = videoLanguages[item.id.toString()] || item.language;
              const thumbnailUri = item.thumbnail_uri || null;
              
              return (
                <View className="flex flex-row items-cente justify-between p-2 border-b-[1px] border-gray-300 h-fit min-h-[130px]">
                  <TouchableOpacity
                    className="w-[45%]"
                    onPress={() => handleVideoPress(item)}
                  >
                    {thumbnailUri ? (
                      <Image
                        source={{ uri: thumbnailUri }}
                        className="h-[100px] w-full"
                        style={styles.thumbnail}
                      />
                    ) : (
                      <View className="h-[100px] w-full bg-gray-600 items-center justify-center">
                        <Text className="text-white text-xs">No Thumbnail</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Video Details along with translation option */}
                  <View className="flex w-[55%] pl-2 justify-between items-start h-[97px]">
                    <Text className="text-white text-left text-xl w-full font-bold break-words">
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text className="text-white text-sm opacity-80 mt-1" numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <View className="flex gap-2 flex-row mt-2">
                      <TouchableOpacity
                        onPress={() => toggleVideoLanguage(item.id.toString())}
                        className="bg-white p-2.5 rounded-full">
                        <Image className="w-6 h-6" source={translate_img} style={{ tintColor: 'black' }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    resizeMode: "contain",
  },
});

export default VideoList;