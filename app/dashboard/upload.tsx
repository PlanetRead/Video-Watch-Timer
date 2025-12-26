import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import {
  createVideo,
  getAllVideos,
  deleteVideo,
  type Video,
} from "../database/database";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import { requestMediaLibraryPermissions, requestCameraPermissions, checkMediaLibraryPermissions } from "@/utils/permissions";
import { getTitleItems } from "@/config/videoTitles";
import { getStardostTitleItems } from "@/config/stardostTitles";

// Separate component for manual title input using fully uncontrolled pattern
// This prevents ANY re-renders from causing focus loss
const ManualTitleInput = React.memo(({ 
  onChangeText, 
  inputRef 
}: { 
  onChangeText: (text: string) => void; 
  inputRef: React.RefObject<TextInput> 
}) => {
  const handleChange = React.useCallback((text: string) => {
    // Update parent without causing re-renders
    onChangeText(text);
  }, [onChangeText]);

  return (
    <View className="mt-3" collapsable={false}>
      <TextInput
        ref={inputRef}
        placeholder="Enter video title manually"
        onChangeText={handleChange}
        className="border border-gray-300 rounded-lg p-3 bg-white"
        blurOnSubmit={false}
        editable={true}
        selectTextOnFocus={false}
        keyboardType="default"
        returnKeyType="done"
      />
    </View>
  );
}, () => true); // Never re-render this component - always return true (props are equal)

const UploadVideo = () => {
  const db = useSQLiteContext();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Automatically request permissions when component mounts
  useEffect(() => {
    const requestPermissions = async () => {
      const hasPermission = await checkMediaLibraryPermissions();
      if (!hasPermission) {
        // Automatically request permission
        const granted = await requestMediaLibraryPermissions();
        setPermissionsGranted(granted);
      } else {
        setPermissionsGranted(true);
      }
    };

    requestPermissions();
  }, []);

  // Language dropdown - updates based on source (stardost only has en/hi)
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [languageItems, setLanguageItems] = useState([
    { label: "English", value: "en" },
    { label: "Hindi", value: "hi" },
    { label: "Punjabi", value: "pa" },
  ]);

  // Level dropdown
  const [levelOpen, setLevelOpen] = useState(false);
  const [level, setLevel] = useState("1");
  const [levelItems] = useState([
    { label: "Level 1", value: "1" },
    { label: "Level 2", value: "2" },
    { label: "Level 3", value: "3" },
    { label: "Level 4", value: "4" },
  ]);

  // Source dropdown (bookbox/stardost)
  const [sourceOpen, setSourceOpen] = useState(false);
  const [source, setSource] = useState("bookbox");
  const [sourceItems] = useState([
    { label: "BookBox", value: "bookbox" },
    { label: "StarDost", value: "stardost" },
  ]);

  // Title dropdown - updates based on language and source
  const [titleOpen, setTitleOpen] = useState(false);
  const [titleItems, setTitleItems] = useState(() => getTitleItems(language as "en" | "hi" | "pa"));
  const [showManualTitleInput, setShowManualTitleInput] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const manualTitleInputRef = useRef<TextInput>(null);
  const manualTitleValueRef = useRef<string>(""); // Store value in ref to prevent re-renders
  
  // Get "Other" label based on language
  const getOtherLabel = (lang: "en" | "hi" | "pa") => {
    if (lang === "hi") return "अन्य";
    if (lang === "pa") return "ਹੋਰ";
    return "Other";
  };
  
  // Update language items when source changes
  useEffect(() => {
    if (source === "stardost") {
      // Stardost only has Hindi and English
      setLanguageItems([
        { label: "English", value: "en" },
        { label: "Hindi", value: "hi" },
      ]);
      // If current language is punjabi, switch to english
      if (language === "pa") {
        setLanguage("en");
      }
    } else {
      // Bookbox has all three languages
      setLanguageItems([
        { label: "English", value: "en" },
        { label: "Hindi", value: "hi" },
        { label: "Punjabi", value: "pa" },
      ]);
    }
  }, [source]);

  // Update title items when language or source changes
  useEffect(() => {
    let items;
    if (source === "stardost") {
      // Use stardost titles, only en and hi
      items = getStardostTitleItems(language as "en" | "hi");
    } else {
      // Use bookbox titles, all languages
      items = getTitleItems(language as "en" | "hi" | "pa");
    }
    // Add "Other" option at the end
    const otherLabel = getOtherLabel(language as "en" | "hi" | "pa");
    items.push({ label: otherLabel, value: "__OTHER__" });
    setTitleItems(items);
    // Reset title and manual input when language or source changes
    setTitle("");
    setManualTitle("");
    setShowManualTitleInput(false);
  }, [language, source]);

  // Memoize onChangeText handler - store in ref to prevent re-renders, update state only when needed
  const handleManualTitleChange = useCallback((text: string) => {
    manualTitleValueRef.current = text;
    // Don't update state immediately to prevent re-renders
    // Only update state when user finishes typing (debounced) or on blur
    setManualTitle(text);
  }, []);

  const pickVideo = async () => {
    try {
      // Ensure permissions are granted before picking
      if (!permissionsGranted) {
        const granted = await requestMediaLibraryPermissions();
        if (!granted) {
          return; // Permission denied, user was already shown alert
        }
        setPermissionsGranted(true);
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Verify the file exists
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          Alert.alert("Error", "Selected video file does not exist");
          return;
        }
        
        setVideoUri(asset.uri);
        
        // Automatically generate thumbnail from 1 second into the video
        try {
          // Get thumbnail from 1 second (1000ms) into the video
          let thumbnail = null;
          
          try {
            thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, {
              time: 1000, // 1 second into the video
              quality: 0.9, // Higher quality for better thumbnail
            });
            
            if (thumbnail && thumbnail.uri) {
              // Verify thumbnail exists
              const thumbInfo = await FileSystem.getInfoAsync(thumbnail.uri);
              if (thumbInfo.exists) {
                setThumbnailUri(thumbnail.uri);
              }
            }
          } catch (timeError) {
            // If 1 second fails, try first frame (0ms) as fallback
            try {
              thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, {
                time: 0, // First frame as fallback
                quality: 0.9,
              });
              
              if (thumbnail && thumbnail.uri) {
                const thumbInfo = await FileSystem.getInfoAsync(thumbnail.uri);
                if (thumbInfo.exists) {
                  setThumbnailUri(thumbnail.uri);
                }
              }
            } catch (fallbackError) {
              console.warn("Failed to generate thumbnail from video:", fallbackError);
            }
          }
        } catch (thumbError) {
          console.warn("Failed to generate thumbnail from video:", thumbError);
          // Don't show error to user, just continue without auto-thumbnail
        }
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick video. Please try again.");
    }
  };

  const pickThumbnail = async () => {
    try {
      // Automatically request permissions if not granted
      if (!permissionsGranted) {
        const granted = await requestMediaLibraryPermissions();
        if (!granted) {
          return; // Permission denied, user was already shown alert
        }
        setPermissionsGranted(true);
      }

      // Check permission status
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        // Request permission automatically
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          return; // Permission still not granted
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Verify the file exists
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          Alert.alert("Error", "Selected thumbnail does not exist");
          return;
        }
        
        setThumbnailUri(asset.uri);
      }
    } catch (error) {
      console.error("Error picking thumbnail:", error);
      Alert.alert("Error", "Failed to pick thumbnail. Please try again.");
    }
  };

  // Function to take photo from camera (optional feature)
  const takePhoto = async () => {
    try {
      // Request camera permission automatically
      const cameraGranted = await requestCameraPermissions();
      if (!cameraGranted) {
        return; // Permission denied
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setThumbnailUri(asset.uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const formatDate = (value: string) => {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleDeletePrompt = (video: Video) => {
    Alert.alert(
      "Delete Video",
      `Are you sure you want to delete "${video.title}"? This will remove the local files as well.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDelete(video),
        },
      ]
    );
  };

  const confirmDelete = async (video: Video) => {
    if (!db) {
      return;
    }

    setDeletingId(video.id);
    try {
      if (video.video_uri) {
        try {
          const info = await FileSystem.getInfoAsync(video.video_uri);
          if (info.exists) {
            await FileSystem.deleteAsync(video.video_uri, { idempotent: true });
          }
        } catch (fileError) {
          console.warn("Failed to remove local video file:", fileError);
        }
      }

      if (video.thumbnail_uri) {
        try {
          const info = await FileSystem.getInfoAsync(video.thumbnail_uri);
          if (info.exists) {
            await FileSystem.deleteAsync(video.thumbnail_uri, { idempotent: true });
          }
        } catch (fileError) {
          console.warn("Failed to remove local thumbnail file:", fileError);
        }
      }

      try {
        await db.runAsync("DELETE FROM video_analytics WHERE video_id = ?", [video.id]);
      } catch (cleanupError) {
        console.warn("Failed to delete related analytics records:", cleanupError);
      }

      try {
        await db.runAsync("DELETE FROM video_watch_sessions WHERE video_id = ?", [video.id]);
      } catch (cleanupError) {
        console.warn("Failed to delete watch session records:", cleanupError);
      }

      const deleted = await deleteVideo(db, video.id);
      if (!deleted) {
        throw new Error("Failed to remove video from database");
      }

      await loadVideos();
      Alert.alert("Deleted", "Video deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to delete video: ${message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const saveVideoToLocal = async (sourceUri: string, videoId: string): Promise<string | null> => {
    try {
      // Verify source file exists
      const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
      if (!sourceInfo.exists) {
        console.error("Source video file does not exist:", sourceUri);
        return null;
      }

      const VIDEO_DIR = FileSystem.documentDirectory + "videos/";
      const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
      }

      // Get file extension from source or default to mp4
      const extension = sourceUri.split('.').pop()?.toLowerCase() || 'mp4';
      const validExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
      const finalExtension = validExtensions.includes(extension) ? extension : 'mp4';
      
      const fileUri = VIDEO_DIR + videoId + "." + finalExtension;
      
      // Check if file already exists and delete it
      const existingFile = await FileSystem.getInfoAsync(fileUri);
      if (existingFile.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      await FileSystem.copyAsync({
        from: sourceUri,
        to: fileUri,
      });

      // Verify the file was copied successfully
      const copiedFile = await FileSystem.getInfoAsync(fileUri);
      if (!copiedFile.exists) {
        console.error("Failed to verify copied video file");
        return null;
      }

      return fileUri;
    } catch (error) {
      console.error("Error saving video:", error);
      return null;
    }
  };

  const saveThumbnailToLocal = async (
    sourceUri: string,
    videoId: string
  ): Promise<string | null> => {
    try {
      // Verify source file exists
      const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
      if (!sourceInfo.exists) {
        console.error("Source thumbnail file does not exist:", sourceUri);
        return null;
      }

      const THUMBNAIL_DIR = FileSystem.documentDirectory + "thumbnails/";
      const dirInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(THUMBNAIL_DIR, { intermediates: true });
      }

      // Get file extension from source or default to png
      const extension = sourceUri.split('.').pop()?.toLowerCase() || 'png';
      const validExtensions = ['png', 'jpg', 'jpeg'];
      const finalExtension = validExtensions.includes(extension) ? extension : 'png';
      
      const fileUri = THUMBNAIL_DIR + videoId + "." + finalExtension;
      
      // Check if file already exists and delete it
      const existingFile = await FileSystem.getInfoAsync(fileUri);
      if (existingFile.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      await FileSystem.copyAsync({
        from: sourceUri,
        to: fileUri,
      });

      // Verify the file was copied successfully
      const copiedFile = await FileSystem.getInfoAsync(fileUri);
      if (!copiedFile.exists) {
        console.error("Failed to verify copied thumbnail file");
        return null;
      }

      return fileUri;
    } catch (error) {
      console.error("Error saving thumbnail:", error);
      return null;
    }
  };

  const loadVideos = useCallback(async () => {
    if (!db) {
      setVideos([]);
      setVideosLoading(false);
      return;
    }

    setVideosLoading(true);
    try {
      const allVideos = await getAllVideos(db);
      setVideos(allVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setVideosLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleUpload = async () => {
    // Check if title is valid
    if (!title.trim() || title === "__OTHER__") {
      if (title === "__OTHER__" && !manualTitle.trim()) {
        Alert.alert("Error", "Please enter a video title manually");
        return;
      }
      if (!title.trim()) {
        Alert.alert("Error", "Please enter a video title");
        return;
      }
    }
    
    // Use manual title if "Other" was selected
    const finalTitle = title === "__OTHER__" ? manualTitle.trim() : title.trim();
    
    if (!finalTitle) {
      Alert.alert("Error", "Please enter a video title");
      return;
    }

    if (!videoUri) {
      Alert.alert("Error", "Please select a video file");
      return;
    }

    // Verify video file still exists
    try {
      const videoInfo = await FileSystem.getInfoAsync(videoUri);
      if (!videoInfo.exists) {
        Alert.alert("Error", "Selected video file no longer exists. Please select again.");
        setVideoUri(null);
        return;
      }
    } catch (error) {
      Alert.alert("Error", "Cannot access selected video file. Please select again.");
      setVideoUri(null);
      return;
    }

    setUploading(true);

    try {
      // Generate a unique ID for the video using timestamp and random number
      const videoId = `uploaded_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      // Save video to local storage
      const savedVideoUri = await saveVideoToLocal(videoUri, videoId);
      if (!savedVideoUri) {
        throw new Error("Failed to save video to local storage");
      }

      // Verify saved video exists
      const savedVideoInfo = await FileSystem.getInfoAsync(savedVideoUri);
      if (!savedVideoInfo.exists) {
        throw new Error("Saved video file verification failed");
      }

      // Save thumbnail if provided
      let savedThumbnailUri = null;
      if (thumbnailUri) {
        try {
          const thumbInfo = await FileSystem.getInfoAsync(thumbnailUri);
          if (thumbInfo.exists) {
            savedThumbnailUri = await saveThumbnailToLocal(thumbnailUri, videoId);
            // Thumbnail is optional, so we don't throw error if it fails
            if (savedThumbnailUri) {
              const savedThumbInfo = await FileSystem.getInfoAsync(savedThumbnailUri);
              if (!savedThumbInfo.exists) {
                console.warn("Thumbnail saved but verification failed, continuing without thumbnail");
                savedThumbnailUri = null;
              }
            }
          }
        } catch (thumbError) {
          console.warn("Error saving thumbnail, continuing without it:", thumbError);
          // Continue without thumbnail as it's optional
        }
      }

      // Create video record in database
      const videoDbId = await createVideo(
        db,
        finalTitle,
        description.trim() || "",
        savedThumbnailUri || "",
        savedVideoUri,
        language,
        level,
        source
      );

      if (videoDbId) {
        Alert.alert("Success", "Video uploaded successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setTitle("");
              setDescription("");
              setVideoUri(null);
              setThumbnailUri(null);
              setLanguage("en");
              setLevel("1");
              setSource("bookbox");
              setTitleOpen(false);
              setLanguageOpen(false);
              setLevelOpen(false);
              setSourceOpen(false);
              setManualTitle("");
              setShowManualTitleInput(false);
              // Navigate back to home or refresh
              loadVideos();
            },
          },
        ]);
      } else {
        // Clean up saved files if database save failed
        try {
          if (savedVideoUri) {
            await FileSystem.deleteAsync(savedVideoUri, { idempotent: true });
          }
          if (savedThumbnailUri) {
            await FileSystem.deleteAsync(savedThumbnailUri, { idempotent: true });
          }
        } catch (cleanupError) {
          console.error("Error cleaning up files:", cleanupError);
        }
        throw new Error("Failed to save video to database");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert("Error", `Failed to upload video: ${errorMessage}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <View className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-black font-bold flex-1 pr-2">{item.title}</Text>
        <TouchableOpacity
          onPress={() => handleDeletePrompt(item)}
          disabled={deletingId === item.id}
          className="bg-red-600 px-3 py-1.5 rounded"
        >
          {deletingId === item.id ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-xs font-bold">Delete</Text>
          )}
        </TouchableOpacity>
      </View>
      {item.description ? (
        <Text className="text-gray-700 text-sm mb-2" numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-600">
          Language: <Text className="font-semibold text-gray-700">{item.language.toUpperCase()}</Text>
        </Text>
        <Text className="text-xs text-gray-600">
          Level: <Text className="font-semibold text-gray-700">{item.level}</Text>
        </Text>
        <Text className="text-xs text-gray-600">
          Source: <Text className="font-semibold text-gray-700">{(item.source || "bookbox").toUpperCase()}</Text>
        </Text>
      </View>
      <View className="flex-row justify-end mt-1">
        <Text className="text-xs text-gray-500">
          {formatDate(item.created_at)}
        </Text>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View className="py-6 items-center">
      {videosLoading ? (
        <>
          <ActivityIndicator color="#7e22ce" />
          <Text className="text-gray-600 mt-2">Loading videos...</Text>
        </>
      ) : (
        <Text className="text-gray-600">No uploaded videos yet.</Text>
      )}
    </View>
  );

  const renderHeader = useCallback(() => (
    <View>
      {/* Back Button */}
      <TouchableOpacity
        className="bg-purple-700 p-3 rounded-lg mb-4"
        onPress={() => router.replace("/(tabs)")}
      >
        <View className="flex-row items-center justify-center gap-2">
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text className="text-white text-center font-bold">Back to Home</Text>
        </View>
      </TouchableOpacity>
      
      {/* Navigation Tabs */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className="flex-1 bg-gray-200 p-3 rounded-lg"
          onPress={() => router.replace("/dashboard")}
        >
          <Text className="text-purple-700 text-center font-bold">Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-purple-700 p-3 rounded-lg"
          onPress={() => router.replace("/dashboard/upload")}
        >
          <Text className="text-white text-center font-bold">Upload Video</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-black text-2xl font-black">Upload Video</Text>
      </View>

      {/* Video File Selection */}
      <View className="mb-4">
        <Text className="text-black text-base font-bold mb-2">Select Video File</Text>
        <TouchableOpacity
          onPress={pickVideo}
          className="border-2 border-dashed border-gray-400 rounded-lg p-8 items-center justify-center bg-gray-50"
        >
          {videoUri ? (
            <View className="items-center">
              <Ionicons name="checkmark-circle" size={48} color="#7e22ce" />
              <Text className="text-purple-700 mt-2 font-semibold">Video Selected</Text>
              <Text className="text-gray-600 text-xs mt-1">Tap to change</Text>
            </View>
          ) : (
            <View className="items-center">
              <Ionicons name="cloud-upload-outline" size={48} color="#7e22ce" />
              <Text className="text-purple-700 mt-2 font-semibold">Tap to select video</Text>
              <Text className="text-gray-600 text-xs mt-1">MP4, MOV, AVI supported</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Source, Language and Level Dropdowns */}
      <View className="mb-4">
        <Text className="text-black text-base font-bold mb-2">Source</Text>
        <View style={{ zIndex: sourceOpen ? 5000 : 1 }}>
          <DropDownPicker
            open={sourceOpen}
            value={source}
            items={sourceItems}
            setOpen={(val) => {
              setSourceOpen(val);
              if (languageOpen) setLanguageOpen(false);
              if (levelOpen) setLevelOpen(false);
              if (titleOpen) setTitleOpen(false);
            }}
            setValue={setSource}
            placeholder="Select source"
            containerStyle={{ minHeight: 40 }}
            zIndex={sourceOpen ? 5000 : 1}
            zIndexInverse={1000}
          />
        </View>
      </View>

      <View className="flex-row gap-4 mb-4">
        <View className="flex-1" style={{ zIndex: languageOpen ? 4000 : 1 }}>
          <Text className="text-black text-base font-bold mb-2">Language</Text>
          <DropDownPicker
            open={languageOpen}
            value={language}
            items={languageItems}
            setOpen={(val) => {
              setLanguageOpen(val);
              if (levelOpen) setLevelOpen(false);
              if (titleOpen) setTitleOpen(false);
              if (sourceOpen) setSourceOpen(false);
            }}
            setValue={setLanguage}
            placeholder="Select language"
            containerStyle={{ minHeight: 40 }}
            zIndex={languageOpen ? 4000 : 1}
            zIndexInverse={1000}
          />
        </View>

        <View className="flex-1" style={{ zIndex: levelOpen ? 3000 : 1 }}>
          <Text className="text-black text-base font-bold mb-2">Level</Text>
          <DropDownPicker
            open={levelOpen}
            value={level}
            items={levelItems}
            setOpen={(val) => {
              setLevelOpen(val);
              if (languageOpen) setLanguageOpen(false);
              if (titleOpen) setTitleOpen(false);
              if (sourceOpen) setSourceOpen(false);
            }}
            setValue={setLevel}
            placeholder="Select level"
            containerStyle={{ minHeight: 40 }}
            zIndex={levelOpen ? 3000 : 1}
            zIndexInverse={1000}
          />
        </View>
      </View>

      {/* Video Title */}
      <View className="mb-4" style={{ zIndex: titleOpen ? 4000 : 1 }}>
        <Text className="text-black text-base font-bold mb-2">Video Title</Text>
        <DropDownPicker
          open={titleOpen}
          value={showManualTitleInput ? "__OTHER__" : title}
          items={titleItems}
          setOpen={(val) => {
            setTitleOpen(val);
            if (languageOpen) setLanguageOpen(false);
            if (levelOpen) setLevelOpen(false);
            if (sourceOpen) setSourceOpen(false);
          }}
          setValue={(value: string | ((prev: string) => string)) => {
            // Handle both string value and callback function
            const actualValue = typeof value === "function" ? value(title) : value;
            if (actualValue === "__OTHER__") {
              setShowManualTitleInput(true);
              setTitle("__OTHER__");
              // Focus the input after a delay to ensure it's rendered
              setTimeout(() => {
                if (manualTitleInputRef.current) {
                  manualTitleInputRef.current.focus();
                }
              }, 300);
            } else {
              setShowManualTitleInput(false);
              setTitle(actualValue);
              setManualTitle(""); // Clear manual title when selecting from dropdown
            }
          }}
          placeholder="Select video title"
          searchable={true}
          searchPlaceholder="Search titles..."
          containerStyle={{ minHeight: 40 }}
          listMode="MODAL"
          modalTitle="Select Video Title"
          modalAnimationType="slide"
          modalContentContainerStyle={{ 
            backgroundColor: "white",
            padding: 20,
          }}
          modalProps={{
            animationType: "slide",
            transparent: false,
          }}
          maxHeight={600}
          zIndex={titleOpen ? 4000 : 1}
          zIndexInverse={1000}
          style={{
            backgroundColor: "#fafafa",
          }}
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-black text-base font-bold mb-2">Description (Optional)</Text>
        <TextInput
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-3 bg-white"
          textAlignVertical="top"
        />
      </View>

      {/* Thumbnail Selection */}
      <View className="mb-4">
        <Text className="text-black text-base font-bold mb-2">Thumbnail (Optional)</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={pickThumbnail}
            className="flex-1 border-2 border-dashed border-gray-400 rounded-lg p-4 items-center justify-center bg-gray-50"
          >
            {thumbnailUri ? (
              <View className="items-center">
                <Image source={{ uri: thumbnailUri }} className="w-full h-32 rounded" />
                <Text className="text-purple-700 mt-2 font-semibold text-xs">Change</Text>
              </View>
            ) : (
              <View className="items-center">
                <Ionicons name="image-outline" size={32} color="#7e22ce" />
                <Text className="text-purple-700 mt-2 font-semibold text-xs">From Gallery</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={takePhoto}
            className="flex-1 border-2 border-dashed border-gray-400 rounded-lg p-4 items-center justify-center bg-gray-50"
          >
            <View className="items-center">
              <Ionicons name="camera-outline" size={32} color="#7e22ce" />
              <Text className="text-purple-700 mt-2 font-semibold text-xs">Take Photo</Text>
            </View>
          </TouchableOpacity>
        </View>
        {thumbnailUri && (
          <Text className="text-gray-600 text-xs mt-2 text-center">Thumbnail selected</Text>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        onPress={handleUpload}
        disabled={uploading}
        className="bg-purple-700 p-4 rounded-lg mt-4"
      >
        {uploading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator color="white" />
            <Text className="text-white text-center font-bold ml-2">Uploading...</Text>
          </View>
        ) : (
          <Text className="text-white text-center font-bold">Add Video</Text>
        )}
      </TouchableOpacity>

      <View className="mt-8 mb-2">
        <Text className="text-black text-2xl font-black">Uploaded Videos</Text>
      </View>
    </View>
  ), [title, language, level, source, videoUri, thumbnailUri, description, titleOpen, languageOpen, levelOpen, sourceOpen, titleItems, languageItems, sourceItems, showManualTitleInput, uploading, pickVideo, pickThumbnail, takePhoto, handleUpload, router, handleManualTitleChange]);

  // Handle back button to go back to home page
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Navigate to home page instead of going back in history
        router.replace("/(tabs)");
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }, [router])
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      {/* Manual title input rendered outside FlatList - always mounted to prevent focus loss */}
      <View 
        style={{ 
          paddingHorizontal: showManualTitleInput ? 16 : 0, 
          paddingTop: showManualTitleInput ? 16 : 0, 
          paddingBottom: showManualTitleInput ? 8 : 0, 
          backgroundColor: 'white',
          height: showManualTitleInput ? undefined : 0,
          overflow: 'hidden'
        }} 
        pointerEvents={showManualTitleInput ? 'auto' : 'none'}
        collapsable={false}
      >
        {showManualTitleInput && (
          <>
            <Text className="text-black text-base font-bold mb-2">Enter Video Title</Text>
            <ManualTitleInput
              onChangeText={handleManualTitleChange}
              inputRef={manualTitleInputRef}
            />
          </>
        )}
      </View>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVideoItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        scrollEnabled={!titleOpen && !languageOpen && !levelOpen}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        keyboardDismissMode="none"
      />
    </SafeAreaView>
  );
};

export default UploadVideo;

