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
import React, { useState, useEffect, useCallback } from "react";
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
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { requestMediaLibraryPermissions, requestCameraPermissions, checkMediaLibraryPermissions } from "@/utils/permissions";

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

  // Language dropdown
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [languageItems] = useState([
    { label: "English", value: "en" },
    { label: "Hindi", value: "hi" },
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
    if (!title.trim()) {
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
        title.trim(),
        description.trim() || "",
        savedThumbnailUri || "",
        savedVideoUri,
        language,
        level
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

  const renderHeader = () => (
    <View>
      {/* Navigation Tabs */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className="flex-1 bg-gray-200 p-3 rounded-lg"
          onPress={() => router.push("/dashboard")}
        >
          <Text className="text-purple-700 text-center font-bold">Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-purple-700 p-3 rounded-lg"
          onPress={() => router.push("/dashboard/upload")}
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

      {/* Video Title */}
      <View className="mb-4">
        <Text className="text-black text-base font-bold mb-2">Video Title</Text>
        <TextInput
          placeholder="Enter video title"
          value={title}
          onChangeText={setTitle}
          className="border border-gray-300 rounded-lg p-3 bg-white"
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

      {/* Language and Level Dropdowns */}
      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <Text className="text-black text-base font-bold mb-2">Language</Text>
          <DropDownPicker
            open={languageOpen}
            value={language}
            items={languageItems}
            setOpen={(val) => {
              setLanguageOpen(val);
              if (levelOpen) setLevelOpen(false);
            }}
            setValue={setLanguage}
            placeholder="Select language"
            containerStyle={{ minHeight: 40 }}
          />
        </View>

        <View className="flex-1">
          <Text className="text-black text-base font-bold mb-2">Level</Text>
          <DropDownPicker
            open={levelOpen}
            value={level}
            items={levelItems}
            setOpen={(val) => {
              setLevelOpen(val);
              if (languageOpen) setLanguageOpen(false);
            }}
            setValue={setLevel}
            placeholder="Select level"
            containerStyle={{ minHeight: 40 }}
          />
        </View>
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
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVideoItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
};

export default UploadVideo;

