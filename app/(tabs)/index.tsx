import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, AppStateStatus } from "react-native";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsers, createUser, deleteUser, checkSchema, getAllVideos, Video } from "../database/database";
import { videoTitles } from "../../config/videoTitles";
import { stardostVideoTitles } from "../../config/stardostTitles";
import { useSQLiteContext } from "expo-sqlite";
import * as Application from 'expo-application';
import { Platform } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useUser } from "../userContext";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

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
  
  // Source dropdown (bookbox/stardost) - declared early so it can be used in useEffect
  const [source, setSource] = useState("bookbox");
  const [sourceItems] = useState([
    { label: "BookBox", value: "bookbox" },
    { label: "StarDost", value: "stardost" },
  ]);
  
  // Language items - dynamically update based on source
  const [items, setItems] = useState([
    { label: "English", value: "en" },
    { label: "Hindi", value: "hi" },
    { label: "Punjabi", value: "pa" },
  ]);

  // Update language items based on source
  useEffect(() => {
    if (source === "stardost") {
      // Stardost only has Hindi and English
      setItems([
        { label: "English", value: "en" },
        { label: "Hindi", value: "hi" },
      ]);
      // If current language is punjabi, switch to english
      if (language === "pa") {
        setLanguage("en");
        AsyncStorage.setItem('languageDropdown', "en");
      }
    } else {
      // Bookbox has all three languages
      setItems([
        { label: "English", value: "en" },
        { label: "Hindi", value: "hi" },
        { label: "Punjabi", value: "pa" },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]); // Only react to source changes, not language changes

  const [videoLanguages, setVideoLanguages] = useState<VideoLanguages>({});
  // Track which video ID should display which other video ID (for language switching)
  // Key: original video ID, Value: switched video ID to display
  const [switchedVideos, setSwitchedVideos] = useState<{ [videoId: number]: number }>({});

  // Find videos with the same title in different languages
  const findVideosByTitle = (currentVideo: Video): { en?: Video; hi?: Video; pa?: Video } => {
    const result: { en?: Video; hi?: Video; pa?: Video } = {};
    const videoSource = currentVideo.source || "bookbox";
    
    // Find the matching title entry in appropriate config (bookbox or stardost)
    let titleEntry: any = null;
    if (videoSource === "stardost") {
      titleEntry = stardostVideoTitles.find((vt) => {
        return (
          vt.english === currentVideo.title ||
          vt.hindi === currentVideo.title
        );
      });
    } else {
      titleEntry = videoTitles.find((vt) => {
        return (
          vt.english === currentVideo.title ||
          vt.hindi === currentVideo.title ||
          vt.punjabi === currentVideo.title
        );
      });
    }
    
    if (!titleEntry) {
      // If no match found in config, just return the current video
      return { [currentVideo.language]: currentVideo };
    }
    
    // Find all videos with matching titles in any language (same source)
    videos.forEach((video) => {
      const matchingSource = video.source || "bookbox";
      // Only match videos from the same source
      if (matchingSource !== videoSource) return;
      
      if (videoSource === "stardost") {
        // For stardost, only check english and hindi
        if (
          video.title === titleEntry.english ||
          video.title === titleEntry.hindi
        ) {
          if (video.language === "en") result.en = video;
          else if (video.language === "hi") result.hi = video;
        }
      } else {
        // For bookbox, check all languages
        if (
          video.title === titleEntry.english ||
          video.title === titleEntry.hindi ||
          video.title === titleEntry.punjabi
        ) {
          if (video.language === "en") result.en = video;
          else if (video.language === "hi") result.hi = video;
          else if (video.language === "pa") result.pa = video;
        }
      }
    });
    
    return result;
  };

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
      const savedSource = await AsyncStorage.getItem('sourceDropdown');
      if (savedSource) {
        setSource(savedSource);
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
        setSource("bookbox");
        await AsyncStorage.setItem("videoLanguages", JSON.stringify(resetLanguages));
        await AsyncStorage.setItem("levelDropdown", "all");
        await AsyncStorage.setItem('languageDropdown', "en");
        await AsyncStorage.setItem('sourceDropdown', "bookbox");
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

  // Source dropdown open state
  const [sourceOpen, setSourceOpen] = useState(false);

  const handleLanguageChange = (value: ((prevValue: string) => string) | string) => {
    const newValue = typeof value === "function" ? value(language) : value;
    setLanguage(newValue);
    AsyncStorage.setItem('languageDropdown', newValue);
    // Reset switched videos when language filter changes to show original versions
    setSwitchedVideos({});
  };

  const handleLevelChange = (value: ((prevValue: string) => string) | string) => {
    const newValue = typeof value === "function" ? value(level) : value;
    setLevel(newValue);
    AsyncStorage.setItem('levelDropdown', newValue);
  };

  const handleSourceChange = (value: ((prevValue: string) => string) | string) => {
    const newValue = typeof value === "function" ? value(source) : value;
    setSource(newValue);
    AsyncStorage.setItem('sourceDropdown', newValue);
    // Language will be updated by useEffect when source changes if needed
  };


  // Get a consistent key for a video group (same title across languages)
  const getVideoGroupKey = (video: Video): string | null => {
    const videoSource = video.source || "bookbox";
    let titleEntry: any = null;
    
    if (videoSource === "stardost") {
      titleEntry = stardostVideoTitles.find((vt) => {
        return (
          vt.english === video.title ||
          vt.hindi === video.title
        );
      });
    } else {
      titleEntry = videoTitles.find((vt) => {
        return (
          vt.english === video.title ||
          vt.hindi === video.title ||
          vt.punjabi === video.title
        );
      });
    }
    
    // Use English title as the consistent key, or fallback to video title if not in config
    return titleEntry ? titleEntry.english : video.title;
  };

  const toggleVideoLanguage = (currentVideo: Video) => {
    try {
      // Find all available languages for this title
      const titleVideos = findVideosByTitle(currentVideo);
      const originalLang = currentVideo.language;
      
      // Get all available languages for this title
      const availableLangs: string[] = [];
      const availableVideos: Video[] = [];
      if (titleVideos.en) {
        availableLangs.push('en');
        availableVideos.push(titleVideos.en);
      }
      if (titleVideos.hi) {
        availableLangs.push('hi');
        availableVideos.push(titleVideos.hi);
      }
      if (titleVideos.pa) {
        availableLangs.push('pa');
        availableVideos.push(titleVideos.pa);
      }
      
      if (availableLangs.length <= 1) {
        return;
      }
      
      // Determine what language is currently being displayed
      let currentlyDisplayedLang = originalLang;
      const switchedVideoId = switchedVideos[currentVideo.id];
      
      if (switchedVideoId) {
        // This video is switched - find which language it's showing
        const switchedVideo = videos.find(v => v.id === switchedVideoId);
        if (switchedVideo) {
          currentlyDisplayedLang = switchedVideo.language;
        }
      }
      
      // Find the current language index in available languages
      const currentIndex = availableLangs.indexOf(currentlyDisplayedLang);
      if (currentIndex === -1) {
        return;
      }
      
      // Get the next language index (cycle through all available languages)
      const nextIndex = (currentIndex + 1) % availableLangs.length;
      const nextLang = availableLangs[nextIndex];
      
      // If next language is the original, remove the switch (show original)
      if (nextLang === originalLang) {
        setSwitchedVideos(prev => {
          const newSwitched = { ...prev };
          delete newSwitched[currentVideo.id];
          return newSwitched;
        });
      } else {
        // Switch to the next language
        const targetVideo = titleVideos[nextLang as keyof typeof titleVideos];
        if (targetVideo && targetVideo.id) {
          // Track by the current video's ID - when this video is rendered, show the target video instead
          setSwitchedVideos(prev => ({
            ...prev,
            [currentVideo.id]: targetVideo.id
          }));
        }
      }
    } catch (error) {
      console.error('Error in toggleVideoLanguage:', error);
    }
  };

  // Check if video has other language versions available
  const hasOtherLanguageVersions = (video: Video): boolean => {
    const titleVideos = findVideosByTitle(video);
    const currentLang = video.language;
    
    if (currentLang === "en") {
      return !!(titleVideos.hi || titleVideos.pa);
    } else if (currentLang === "hi") {
      return !!(titleVideos.en || titleVideos.pa);
    } else if (currentLang === "pa") {
      return !!(titleVideos.en || titleVideos.hi);
    }
    
    return false;
  };

  const handleVideoPress = (video: Video) => {
    const itemLanguage = videoLanguages[video.id.toString()] || video.language;
    router.push(`/video/${video.id}?language=${itemLanguage}`);
  };

  // Get the video to display, checking if it's been switched to another language
  // If this video has been switched, show the switched version (regardless of language filter)
  const getDisplayVideo = (video: Video): Video => {
    const switchedVideoId = switchedVideos[video.id];
    
    if (switchedVideoId) {
      const switchedVideo = videos.find(v => v.id === switchedVideoId);
      if (switchedVideo) {
        // Show the switched version - this video item has been switched
        return switchedVideo;
      }
    }
    
    // No switch, show original
    return video;
  };

  // Get all switched video IDs (videos that are being displayed as switched versions)
  const switchedVideoIds = new Set(Object.values(switchedVideos));
  // Get all original video IDs that have been switched (these should still appear in their language filter)
  const switchedOriginalIds = new Set(Object.keys(switchedVideos).map(Number));
  
  const filteredVideos = videos.filter((video) => {
    const matchesLevel = level === "all" || video.level === level;
    const videoLang = video.language || "en";
    const videoSource = video.source || "bookbox"; // Default to bookbox for existing videos
    
    // Filter by source
    const matchesSource = videoSource === source;
    
    // Check if this video is being displayed as a switched version elsewhere
    // If so, don't show it here (it will be shown where the original is)
    if (switchedVideoIds.has(video.id)) {
      // This video is being shown as a switched version of another video
      // Only show it in its own language filter if it hasn't been switched from
      // Actually, we want to show both - the original in its filter, and the switched version where the original is
      // So we should still show switched videos in their own language filter
      const matchesLanguage = language ? videoLang === language : true;
      return matchesLevel && matchesLanguage && matchesSource;
    }
    
    // For original videos: show them in their language filter
    // Even if they've been switched (the switch only affects display, not filtering)
    const matchesLanguage = language ? videoLang === language : true;
    return matchesLevel && matchesLanguage && matchesSource;
  });

  return (
    <View className="bg-purple-700 h-full flex-1">

      <View className="flex flex-row justify-between px-4 py-6 items-center mt-10 gap-3">
        <DropDownPicker
          open={sourceOpen}
          value={source}
          items={sourceItems}
          setOpen={(val) => {
            setSourceOpen(val);
            if (open) setOpen(false);
            if (levelOpen) setLevelOpen(false);
          }}
          setValue={handleSourceChange}
          containerStyle={{ paddingVertical: 0, paddingHorizontal: 0, flex: 1 }}
          style={{ height: 40, minHeight: 30 }}
          textStyle={{ fontSize: 11 }}
          arrowIconStyle={{ marginHorizontal: -5 }}
          zIndex={sourceOpen ? 5000 : 1}
          zIndexInverse={1000}
        />
        <DropDownPicker
          open={open}
          value={language}
          items={items}
          setOpen={(val) => {
            setOpen(val);
            if (levelOpen) setLevelOpen(false);
            if (sourceOpen) setSourceOpen(false);
          }}
          setValue={handleLanguageChange}
          containerStyle={{ paddingVertical: 0, paddingHorizontal: 0, flex: 1 }}
          style={{ height: 40, minHeight: 30 }}
          textStyle={{ fontSize: 11 }}
          arrowIconStyle={{ marginHorizontal: -5 }}
          zIndex={open ? 4000 : 1}
          zIndexInverse={1000}
        />
        <DropDownPicker
          open={levelOpen}
          value={level}
          items={levels}
          setOpen={(val) => {
            setLevelOpen(val);
            if (open) setOpen(false);
            if (sourceOpen) setSourceOpen(false);
          }}
          setValue={handleLevelChange}
          containerStyle={{ paddingVertical: 0, flex: 1, paddingHorizontal: 0 }}
          style={{ height: 40, minHeight: 30 }}
          textStyle={{ fontSize: 11 }}
          arrowIconStyle={{ marginHorizontal: -5 }}
          zIndex={levelOpen ? 3000 : 1}
          zIndexInverse={1000}
        />
        <TouchableOpacity 
          className="w-[100px] h-[70px] flex-1" 
          onLongPress={async () => {
            // Clear login state to ensure login screen always shows when clicking bird logo
            try {
              await AsyncStorage.removeItem('admin_logged_in');
            } catch (error) {
              console.error('Error clearing login state:', error);
            }
            router.replace(`/login`);
          }} 
          delayLongPress={5000}
        >
          <Image source={billion_readers} className="w-full h-full"
            style={{ resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>

      {
  loading ? (
    <FlatList
      style={{ backgroundColor: '#6B21A8' }}
      contentContainerStyle={{ backgroundColor: '#6B21A8' }}
      data={[1, 2, 3, 4]}
      keyExtractor={(item) => item.toString()}
      renderItem={() => (
        <View className="flex flex-row justify-between p-4 border-b-[1px] border-gray-100 h-[130px] bg-purple-700">
          <View className="bg-gray-100 w-[45%] h-[100px] rounded" />
          <View className="w-[50%] pl-2 justify-between">
            <View className="bg-gray-100 h-5 w-3/4 rounded mb-2" />
            <View className="bg-gray-100 h-5 w-1/2 rounded" />
          </View>
        </View>
      )}
    />
  ) : videos.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8 bg-purple-700">
          <Text className="text-white text-xl font-bold text-center mb-4">
            No videos available
          </Text>
          <Text className="text-white text-center opacity-80">
            Please log in as admin to upload videos
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#6B21A8' }}>
          <FlatList
            style={{ backgroundColor: '#6B21A8', flex: 1 }}
            contentContainerStyle={{ paddingBottom: 140, backgroundColor: '#6B21A8' }}
            data={filteredVideos}
            keyExtractor={(item) => {
              // Always use the original video ID as the key to maintain React's tracking
              // The display video might change, but the key should stay the same
              return item.id.toString();
            }}
            renderItem={({ item }) => {
              // Get the display video (might be switched to another language)
              const displayVideo = getDisplayVideo(item);
              const itemLanguage = videoLanguages[displayVideo.id.toString()] || displayVideo.language;
              const thumbnailUri = displayVideo.thumbnail_uri || null;
              const titleVideos = findVideosByTitle(displayVideo);
              
              // Check if other language versions exist for the original video (not the display video)
              // This ensures we check availability based on the original video's title group
              const hasOtherLanguages = hasOtherLanguageVersions(item);
              
              return (
                <View className="flex flex-row items-cente justify-between p-2 border-b-[1px] border-gray-300 h-fit min-h-[130px]">
                  <TouchableOpacity
                    className="w-[45%]"
                    onPress={() => handleVideoPress(displayVideo)}
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
                      {displayVideo.title}
                    </Text>
                    {displayVideo.description ? (
                      <Text className="text-white text-sm opacity-80 mt-1" numberOfLines={2}>
                        {displayVideo.description}
                      </Text>
                    ) : null}
                    <View className="flex gap-2 flex-row mt-2">
                      <TouchableOpacity
                        onPress={() => toggleVideoLanguage(item)}
                        disabled={!hasOtherLanguages}
                        className={`p-2.5 rounded-full ${hasOtherLanguages ? 'bg-white' : 'bg-gray-400'}`}
                        style={{ opacity: hasOtherLanguages ? 1 : 0.5 }}
                      >
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