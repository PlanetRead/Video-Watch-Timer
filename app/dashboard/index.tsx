import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getVideoAnalyticsByUser, getUsers, deleteAllUserData, createUser, editUserName, getAllVideos, getVideoWatchSessionsByUser } from "../database/database";
import { useSQLiteContext } from "expo-sqlite";
import { Dimensions } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import PieChart from "react-native-pie-chart";
import { StyleSheet } from "react-native";
import SyncToCloud from "@/components/SyncToCloud";
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Modal, BackHandler } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import ErrorBoundary from "@/components/ErrorBoundary";


// Define type for analytics data
type AnalyticsData = {
  id: number;
  video_id: number;
  language: string;
  total_time_day: number;
  total_views_day: number;
  date: string;
  last_time_stamp: string | number | null;
  user_id?: string;
  pdf_en?: string;
  pdf_hindi?: string;
  pdf_punjabi?: string;
  description?: string;
  english_title?: string;
  punjabi_title?: string;
  thumbnail_en?: any;
  thumbnail_hindi?: any;
  thumbnail_punjabi?: any;
  level?: string;
  video_duration?: number;
  completed?: boolean;
  isSessionEntry?: boolean;
};

const AnalyticsDashboard = () => {
  console.log("AnalyticsDashboard: Component rendering");
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const db = useSQLiteContext();
  const router = useRouter();
  
  console.log("Database available:", !!db, "Router available:", !!router);

  // Check database availability immediately - but don't block rendering
  useEffect(() => {
    if (!db) {
      console.warn("Database context is not available yet - will retry...");
      // Don't set error immediately - give it time to initialize
    } else if (!router) {
      console.error("Router is not available!");
      setError("Navigation not available. Please restart the app.");
      setLoading(false);
    } else {
      // Both are available, clear any previous errors
      if (error && error.includes("Database")) {
        setError(null);
      }
    }
  }, [db, router, error]);

   // Date range state
   const [startDate, setStartDate] = useState<Date | null>(null);
   const [endDate, setEndDate] = useState<Date | null>(null);
   const [showStartDatePicker, setShowStartDatePicker] = useState(false);
   const [showEndDatePicker, setShowEndDatePicker] = useState(false);

   // For editing the username
   const [username, setUsername] = useState("Default Username"); // current username need to fetch from the db
   const [editModalVisible, setEditModalVisible] = useState(false);
   const [newUsername, setNewUsername] = useState("");
   const [editSuccess, setEditSuccess] = useState(false);
   const [deleteModalVisible, setDeleteModalVisible] = useState(false);
   

  useEffect(() => {
    if (!db) {
      console.log("Database not available in useEffect, will retry...");
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.error("Loading timeout - database still not available after 5 seconds");
        setError("Database initialization is taking too long. Please restart the app.");
        setLoading(false);
      }, 5000); // 5 second timeout
      return () => clearTimeout(timeout);
    }
    
    console.log("AnalyticsDashboard: useEffect triggered, db:", !!db);
    
    let isMounted = true;
    
    const fetchUserDetails = async () => {
      if (!db) {
        console.log("Database not available, setting error");
        if (isMounted) {
          setError("Database not initialized. Please wait...");
          setLoading(false);
        }
        return;
      }

      try {
        console.log("Fetching users from database...");
        const users = await getUsers(db); // Fetch all users
        console.log("Users fetched:", users.length);
        
        if (isMounted) {
          if (users.length > 0) {
            setUserId(users[0].id);
            setUsername(users[0].user_name); // Set the first user's ID
            console.log("User set:", users[0].id);
          } else {
            // If no user exists, that's okay - analytics will be empty
            console.log("No user found in database");
          }
          setError(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    fetchUserDetails();
    
    return () => {
      isMounted = false;
    };
  }, [db]);

  const [totalTime, setTotalTime] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [fullWatchTime, setFullWatchTime] = useState(0);

  const calculateData = React.useCallback((data: AnalyticsData[]) => {
    const totalTimeCalculated = data.reduce(
      (sum, item) => sum + (item.total_time_day || 0),
      0
    );
    const totalViewsCalculated = data.reduce(
      (sum, item) => sum + (item.total_views_day || 0),
      0
    );
    const completedWatchTime = data.reduce((sum, item) => {
      if (item.completed) {
        return sum + (item.video_duration || item.total_time_day || 0);
      }
      return sum;
    }, 0);

    setTotalTime(totalTimeCalculated);
    setTotalViews(totalViewsCalculated);
    setFullWatchTime(completedWatchTime);
  }, []);

  useEffect(() => {
    let isMounted = true;
  
    const fetchDetails = async () => {
      if (!userId || !db) return;
  
      try {
        const data: AnalyticsData[] = await getVideoAnalyticsByUser(db, userId);
        const allVideos = await getAllVideos(db);
        const watchSessions = await getVideoWatchSessionsByUser(db, userId);

        if (isMounted) {
          const videoMap = new Map(allVideos.map((video) => [video.id, video]));

          const aggregatedEntries = data.map((item) => {
            const normalizedTimestamp =
              typeof item.last_time_stamp === "number"
                ? new Date(item.last_time_stamp).toISOString()
                : item.last_time_stamp ?? null;

            const dbVideo = videoMap.get(item.video_id);

            if (dbVideo) {
              return {
                ...item,
                last_time_stamp: normalizedTimestamp,
                english_title: dbVideo.title || "Unknown Video",
                punjabi_title: dbVideo.title || "Unknown Video",
                description: dbVideo.description || "",
                level: dbVideo.level || "1",
                thumbnail_en: dbVideo.thumbnail_uri ? { uri: dbVideo.thumbnail_uri } : null,
                thumbnail_hindi: dbVideo.thumbnail_uri ? { uri: dbVideo.thumbnail_uri } : null,
                thumbnail_punjabi: dbVideo.thumbnail_uri ? { uri: dbVideo.thumbnail_uri } : null,
                isSessionEntry: false,
              };
            }

            return {
              ...item,
              last_time_stamp: normalizedTimestamp,
              english_title: item.english_title || "Unknown Video",
              punjabi_title: item.punjabi_title || "Unknown Video",
              level: item.level || "1",
              isSessionEntry: false,
            };
          });

          const sessionEntries = watchSessions.map((session) => {
            const dbVideo = videoMap.get(session.video_id);
            const watchedAt = session.watched_at ?? new Date().toISOString();
            const sessionDate = watchedAt ? new Date(watchedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

            return {
              id: session.id,
              video_id: session.video_id,
              language: session.language,
              total_time_day: session.watch_time,
              total_views_day: 1,
              date: sessionDate,
              last_time_stamp: watchedAt,
              english_title: dbVideo?.title || `Video ${session.video_id}`,
              punjabi_title: dbVideo?.title || `Video ${session.video_id}`,
              description: dbVideo?.description || "",
              level: dbVideo?.level || "1",
              thumbnail_en: dbVideo?.thumbnail_uri ? { uri: dbVideo.thumbnail_uri } : null,
              thumbnail_hindi: dbVideo?.thumbnail_uri ? { uri: dbVideo.thumbnail_uri } : null,
              thumbnail_punjabi: dbVideo?.thumbnail_uri ? { uri: dbVideo.thumbnail_uri } : null,
              video_duration: session.video_duration ?? 0,
              completed: !!session.completed,
              isSessionEntry: true,
            } as AnalyticsData;
          });

          const sessionKeySet = new Set(
            sessionEntries.map(
              (entry) => `${entry.video_id}|${entry.language}|${entry.date}`
            )
          );

          const aggregatedFallback = aggregatedEntries.filter((entry) => {
            const key = `${entry.video_id}|${entry.language}|${entry.date}`;
            return !sessionKeySet.has(key);
          });

          const combinedData = [...sessionEntries, ...aggregatedFallback];

          // ✅ Always calculate fresh — don't add to previous state
          calculateData(combinedData);
          setAnalyticsData(combinedData);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
  
    fetchDetails();
  
    return () => {
      isMounted = false;
    };
  }, [db, userId, calculateData]);
  
  const { height } = Dimensions.get("window");

  // Level Dropdown State
  const [levelOpen, setLevelOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("All levels");
  const [levelItems] = useState([
    { label: "All Levels", value: "All levels" },
    { label: "Level 1", value: "1" },
    { label: "Level 2", value: "2" },
    { label: "Level 3", value: "3" },
    { label: "Level 4", value: "4" },
  ]);

    // Language Dropdown State
    const [languageOpen, setLanguageOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("All Lang");
    const [languageItems] = useState([
      { label: "All Lang", value: "All Lang" },
      { label: "English", value: "en" },
      { label: "Hindi", value: "hi" },
      { label: "Punjabi", value: "pa" },
    ]);

  // Sort Dropdown State
  const [open, setOpen] = useState(false);
  const [sortoption, setSortOption] = useState<string | null>(null);
  const [items] = useState([
    { label: "Max Views", value: "max_views" },
    { label: "Min Views", value: "min_views" },
    { label: "Max Watched", value: "max_watch_time" },
    { label: "Min Watched", value: "min_watch_time" },
  ]);

  const [filteredData, setFilteredData] = useState<AnalyticsData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle back button to go back to home page - MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
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

  function sortDataByLastTimeStamp(data: any[]) {
    // Create a copy to avoid mutating the original array
    return [...data].sort((a, b) => {
      const dateA = a.last_time_stamp ? new Date(a.last_time_stamp).getTime() : 0;
      const dateB = b.last_time_stamp ? new Date(b.last_time_stamp).getTime() : 0;
      return dateB - dateA; // Sort in descending order
    });
  }

  useEffect(() => {
    if (!sortoption) return;
    
    // Use functional update to get current filteredData state
    setFilteredData((currentData) => {
      if (currentData.length === 0) return currentData;
      
      // Create a copy to avoid mutation
      let sortedData = [...currentData];

      switch (sortoption) {
        case "max_views":
          sortedData.sort((a, b) => b.total_views_day - a.total_views_day);
          break;
        case "min_views":
          sortedData.sort((a, b) => a.total_views_day - b.total_views_day);
          break;
        case "max_watch_time":
          sortedData.sort((a, b) => b.total_time_day - a.total_time_day);
          break;
        case "min_watch_time":
          sortedData.sort((a, b) => a.total_time_day - b.total_time_day);
          break;
        default:
          break;
      }

      console.log("Sorted Data:", sortedData);
      return sortedData;
    });
  }, [sortoption]);

  useEffect(() => {
    console.log("AnalyticsDashboard Mounted");

    return () => {
      console.log("AnalyticsDashboard Unmounted");
    };
  }, []);

   // Handle date changes
   const onStartDateChange = (event:DateTimePickerEvent, selectedDate?:Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  // Reset date filters
  const resetDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  useEffect(() => {
    let result = [...analyticsData];

    // Search Filter
    if (searchQuery.trim() !== "") {
      result = result.filter(
        (item) =>
          item.english_title
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.punjabi_title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level Filter
    if (selectedLevel !== "All levels") {
      result = result.filter(
        (item) => item.level?.toString() === selectedLevel.toString()
      );
    }

    // Language Filter
    if (selectedLanguage !== "All Lang") {
      result = result.filter(item =>
        item.language?.toString() === selectedLanguage.toString()
      );      
    }

    // Date Range Filter
    if (startDate || endDate) {
      result = result.filter((item) => {
        const itemDate = new Date(item.date);
        
        // Check if date is valid
        if (isNaN(itemDate.getTime())) {
          return false;
        }
        
        // Filter by start date if set - create new Date to avoid mutation
        if (startDate) {
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);
          if (itemDate < startOfDay) {
            return false;
          }
        }
        
        // Filter by end date if set - create new Date to avoid mutation
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (itemDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    }

    const sortedResult = sortDataByLastTimeStamp(result);
    setFilteredData(sortedResult);
    calculateData(sortedResult);
    console.log("Filtered Data:", sortedResult);
  }, [searchQuery, analyticsData, selectedLevel, startDate, endDate, selectedLanguage, calculateData]);

  const widthAndHeight = 150;

  const series = [
    { value: 430, color: "#7e22ce" },
    { value: 321, color: "#a347f2" },
    { value: 185, color: "#c76aff" },
    { value: 123, color: "#ed8cff" },
  ];

  const exportData = async () => {
   try {
    alert("Exporting data to CSV");

    // Convert JSON data to CSV
    const csvData = filteredData.map(({pdf_en, pdf_hindi, pdf_punjabi, thumbnail_en, thumbnail_hindi, thumbnail_punjabi, description, ...rest}) => ({ ...rest,username}));
    const csvContent = Papa.unparse(csvData);

    // Define file path
    const fileUri = `${FileSystem.documentDirectory}analytics.csv`;

    // Write the CSV file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    console.log('CSV file saved successfully:', fileUri);

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      alert("Sharing is not available on this device.");
    }
  } catch (error) {
    console.error("Error exporting CSV:", error);
  }
  }

  const deleteData = async () => {
    if (!db) {
      console.error("Database not available for delete operation");
      return;
    }
    try {
      alert("Deleting all user data");
      await deleteAllUserData(db);
      alert("All user data deleted successfully");
      setAnalyticsData([]); // Clear the local state
      setTotalTime(0);
      setTotalViews(0);
      setDeleteModalVisible(false);
    } catch (error) {
      console.error("Error deleting user data:", error);
      alert("Error deleting user data. Please try again.");
    }
  }

   // Format date for display
   const formatDate = (date:Date) => {
    if (!date) return "Select";
    return date.toLocaleDateString("en-CA");
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#6B21A8' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>Loading Dashboard...</Text>
          <Text style={{ color: '#E5E5E5', fontSize: 14, marginTop: 8 }}>Please wait...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#6B21A8' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#FCA5A5', fontSize: 18, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' }}>Error: {error}</Text>
          {db && (
            <TouchableOpacity
              className="bg-white px-4 py-2 rounded"
              onPress={() => {
                setError(null);
                setLoading(true);
                const fetchUserDetails = async () => {
                  try {
                    const users = await getUsers(db);
                    if (users.length > 0) {
                      setUserId(users[0].id);
                      setUsername(users[0].user_name);
                    }
                    setLoading(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Unknown error");
                    setLoading(false);
                  }
                };
                fetchUserDetails();
              }}
            >
              <Text className="text-purple-700 font-bold">Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }
  
  if (!db || !router) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#6B21A8' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#FCA5A5', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Initialization Error
          </Text>
          <Text style={{ color: '#E5E5E5', fontSize: 16, textAlign: 'center' }}>
            Database or router not available. Please restart the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="bg-white"
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={true}
      >
        {/* Navigation Tabs */}
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
        
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            className="flex-1 bg-purple-700 p-3 rounded-lg"
            onPress={() => router.replace("/dashboard")}
          >
            <Text className="text-white text-center font-bold">Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-gray-200 p-3 rounded-lg"
            onPress={() => router.replace("/dashboard/upload")}
          >
            <Text className="text-purple-700 text-center font-bold">Upload Video</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-black text-2xl font-black text-center">
          Analytics
        </Text>
        <Text className="text-gray-400 text-md font-black text-center">
          {userId || "Loading..."}
        </Text>

        <View className="flex flex-row gap-4 justify-around">
          <View>
            <PieChart
              widthAndHeight={widthAndHeight}
              series={series}
              cover={0.8}
            />
            <View style={styles.gauge}>
              <Text className="text-purple-700 text-2xl font-extrabold">
                {totalViews}
              </Text>
              <Text className="text-black text-base">Views</Text>
            </View>
          </View>

          <View>
            <PieChart
              widthAndHeight={widthAndHeight}
              series={series}
              cover={0.8}
            />
            <View style={styles.gauge}>
              <Text className="text-purple-700 text-2xl font-extrabold">
                {totalTime}
              </Text>
              <Text className="text-black text-base">Watch Time</Text>
            </View>
            <Text className="text-gray-500 text-xs text-center mt-2">
              Full Watch Time: {fullWatchTime} s
            </Text>
          </View>
        </View>

        <TouchableOpacity
  className="bg-purple-700 p-2 rounded mt-4"
  onPress={() => setEditModalVisible(true)}
>
  <Text className="text-white text-center">Edit Username : {username}</Text>
</TouchableOpacity>


        <TouchableOpacity 
        className="bg-purple-700 my-2 p-3 mt-4 w-full rounded" 
        onPress={exportData}
      >
        <Text className="text-white text-center font-bold">EXPORT</Text>
      </TouchableOpacity>

        <View className="flex-row justify-between my-2 space-x-2 gap-2">
        {/* SyncToCloud component taking half width */}
        <View className="flex-1">
          <ErrorBoundary
            fallback={
              <View style={{ padding: 10 }}>
                <Text style={{ color: '#dc2626', fontSize: 12, textAlign: 'center' }}>
                  Sync Error
                </Text>
              </View>
            }
          >
            <SyncToCloud />
          </ErrorBoundary>
        </View>
        
        {/* Delete button taking half width */}
        <View className="flex-1">
        <TouchableOpacity 
          className="bg-[#ECE6F0] p-3 w-full" 
          onPress={() => setDeleteModalVisible(true)}
        >
          <Text className="text-red-500 text-center font-bold">DELETE USER DATA</Text>
        </TouchableOpacity>
        </View>
      </View>


        {/* Level, Language and Date Dropdowns */}
        <View className="flex-row justify-between mb-2">
          <View
            className="flex flex-row gap-2 p-2"
            style={{
              borderWidth: 1,
              borderColor: "#d5d5d9",
              backgroundColor: "#ECE6F0",
            }}
          >
            <Text>Filter</Text>

            <Ionicons name="filter" size={20} color="gray" />
          </View>

          {/* Level Dropdown */}
          <DropDownPicker
            open={levelOpen}
            value={selectedLevel}
            items={levelItems}
            setOpen={setLevelOpen}
            setValue={(value) => {
              const updatedValue =
                typeof value === "function" ? value(selectedLevel) : value;
              setSelectedLevel(updatedValue);
            }}
            containerStyle={{ maxWidth: 125 }}
            placeholder="Select Level"
            style={{
              borderWidth: 1,
              borderColor: "#d5d5d9",
              backgroundColor: "#ECE6F0",
              borderRadius: 0,
              paddingHorizontal: 5,
              minHeight: 35,
            }}
            dropDownContainerStyle={{
              backgroundColor: "#ECE6F0",
              borderColor: "#d5d5d9",
              zIndex: 1000,
              borderRadius: 0,
            }}
          />

           {/* Language Dropdown */}
           <DropDownPicker
            open={languageOpen}
            value={selectedLanguage}
            items={languageItems}
            setOpen={setLanguageOpen}
            setValue={(value) => {
              const updatedValue =
                typeof value === "function" ? value(selectedLanguage) : value;
              setSelectedLanguage(updatedValue);
            }}
            containerStyle={{ maxWidth: 125 }}
            placeholder="Select Lang"
            style={{
              borderWidth: 1,
              borderColor: "#d5d5d9",
              backgroundColor: "#ECE6F0",
              borderRadius: 0,
              paddingHorizontal: 5,
              minHeight: 35,
            }}
            dropDownContainerStyle={{
              backgroundColor: "#ECE6F0",
              borderColor: "#d5d5d9",
              zIndex: 1000,
              borderRadius: 0,
            }}
          />

        </View>

         {/* Date Range Filter Section */}
         <View className="flex-row mb-2 w-full gap-2">
            {/* Start Date Picker */}
            <TouchableOpacity 
              onPress={() => setShowStartDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: "#d5d5d9",
                backgroundColor: "#ECE6F0",
                padding: 8,
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="gray" style={{marginRight: 4}} />
              <Text>{startDate ? formatDate(startDate) : "Start Date"}</Text>
            </TouchableOpacity>
            
            {/* End Date Picker */}
            <TouchableOpacity 
              onPress={() => setShowEndDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: "#d5d5d9",
                backgroundColor: "#ECE6F0",
                padding: 8,
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color="gray" style={{marginRight: 4}} />
              <Text>{endDate ? formatDate(endDate) : "End Date"}</Text>
            </TouchableOpacity>
            
            {/* Reset Button */}
            {(startDate || endDate) && (
              <TouchableOpacity 
                onPress={resetDateFilters}
                style={{
                  borderWidth: 1,
                  borderColor: "#d5d5d9",
                  backgroundColor: "#7e22ce",
                  padding: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        
        
        {/* Date Pickers (hidden by default) */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            minimumDate={startDate || undefined}
          />
        )}

        <View
          style={{
            borderColor: "#d5d5d9",
            backgroundColor: "#ECE6F0",
          }}
          className="border px-4 mb-3 flex-row items-center bg-white"
        >
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}

          <TextInput
            className="flex-1 text-black"
            placeholder="Search by title"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TouchableOpacity className="pl-2">
            <Ionicons name="search" size={20} color="purple" />
          </TouchableOpacity>
        </View>

        <View className="flex flex-row justify-between items-end mb-2">
          <Text className="text-2xl font-black">Videos</Text>
          <View className="flex flex-row w-[205px]">
            <Text className="bg-purple-700 text-white text-sm text-center py-[0.6rem] flex items-center justify-center w-[80px] h-[35px]">
              Sort By
            </Text>
            <DropDownPicker
              open={open}
              value={sortoption}
              items={items}
              setOpen={setOpen}
              setValue={(callback) => {
                const newValue = callback(sortoption);
                setSortOption(newValue);
              }}
              containerStyle={{
                maxWidth: 125,
                alignSelf: "center",
                marginBottom: 0,
              }}
              textStyle={{ fontSize: 12 }}
              arrowIconStyle={{ marginHorizontal: -5 }}
              modalAnimationType="slide"
              placeholder={"Select"}
              style={{
                borderWidth: 1,
                borderColor: "#d5d5d9",
                backgroundColor: "#ECE6F0",
                borderRadius: 0,
                paddingHorizontal: 5,
                minHeight: 35,
                zIndex: 100,
              }}
              dropDownContainerStyle={{
                backgroundColor: "#ECE6F0",
                borderWidth: 1,
                borderColor: "#d5d5d9",
                borderRadius: 0,
                gap: 10,
              }}
            />
          </View>
        </View>

        {/* Videos List - rendered as regular Views instead of FlatList */}
        {filteredData.map((item, index) => {
          const thumbnailSource = item.language === "en"
            ? item.thumbnail_en
            : item.language === "hi"
            ? item.thumbnail_hindi
            : item.thumbnail_punjabi;
          
          return (
            <View key={index.toString()} className="flex-row justify-between border-b border-white py-2">
              <View className="flex flex-row items-center justify-between border-b-[1px] border-gray-300 h-fit min-h-[130px]">
                {thumbnailSource ? (
                  <Image
                    source={thumbnailSource}
                    style={{ height: 100, width: "50%" }}
                    resizeMode="contain"
                    className="w-1/2"
                  />
                ) : (
                  <View className="w-1/2 h-[100px] bg-gray-300 items-center justify-center">
                    <Text className="text-gray-500 text-xs">No Thumbnail</Text>
                  </View>
                )}

                {/* Video Details */}
                <View className="flex w-1/2 ml-2 justify-between items-start gap-0 min-h-[100px]">
                  <Text className="text-left text-lg w-full font-bold break-words">
                    {item.language === "en"
                      ? item.english_title
                      : item.punjabi_title}
                  </Text>
                  <View className="flex gap-0">
                    <Text className="text-sm font-bold text-purple-700">
                      Level: {item.level}
                    </Text>

                    <Text className="text-sm font-bold text-purple-700">
                      Watch Time: {item.total_time_day} s
                    </Text>

                    {typeof item.video_duration === "number" && item.video_duration > 0 && (
                      <Text className="text-sm font-bold text-purple-700">
                        Video Duration: {item.video_duration} s
                      </Text>
                    )}

                    {typeof item.completed === "boolean" && (
                      <Text className="text-sm font-bold text-purple-700">
                        Completed Watch: {item.completed ? "Yes" : "No"}
                      </Text>
                    )}

                    <Text className="text-sm font-bold text-purple-700">
                      Total Views: {item.total_views_day}
                    </Text>

                    <Text className="text-sm font-bold text-purple-700">
                      Watched in:{" "}
                      {item.language === "en" ? "English" : "Hindi"}
                    </Text>
                    <Text className="text-sm font-bold text-purple-700">
                      Last Watched: {item.date ? item.date.split("-").reverse().join("-") : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
        
      </ScrollView>
      <Modal
  animationType="slide"
  transparent={true}
  visible={editModalVisible}
  onRequestClose={() => setEditModalVisible(false)}
>
  <View className="flex-1 justify-center items-center bg-black/50">
    <View className="bg-white rounded-xl w-4/5 p-4">
        <>
          <Text className="text-lg font-bold mb-2">Edit Username from {username} to:</Text>

          <TextInput
            className="border border-gray-300 rounded p-2 mb-4"
            placeholder="Enter new username"
            value={newUsername}
            onChangeText={setNewUsername}
          />
          <Text className="text-lg font-bold mb-2 text-red-600">Warning:</Text>
          <Text className="text-red-600 mb-4">Editing your username will delete all the existing data!</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-gray-300 px-4 py-2 rounded"
              onPress={() => setEditModalVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-700 px-4 py-2 rounded"
              onPress={() => {
                if (newUsername.trim() && userId) {
                  setUsername(newUsername);
                  deleteData();
                  editUserName(db, userId, newUsername)
                    .then(() => {
                      setEditSuccess(true);

                      // Short timeout to show success message before closing modal
                      // Note: No cleanup needed as timeout is very short (1.5s) and modal will still be visible
                      setTimeout(() => {
                        setEditModalVisible(false);
                        setEditSuccess(false);
                      }, 1500);
                    })
                    .catch((err) => {
                      console.error("Error editing username:", err);
                      setEditModalVisible(false);
                    });
                  setNewUsername("");  
                }
              }}
            >
              <Text className="text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </>
    </View>
  </View>
</Modal>

<Modal
  animationType="slide"
  transparent={true}
  visible={deleteModalVisible}
  onRequestClose={() => setDeleteModalVisible(false)}
>
  <View className="flex-1 justify-center items-center bg-black/50">
    <View className="bg-white rounded-xl w-4/5 p-4">
        <>
          <Text className="text-lg font-bold mb-2">Warning: This will permanently remove the data. Do you wish to continue?</Text>
    <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-gray-300 px-4 py-2 rounded"
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-700 px-4 py-2 rounded"
              onPress={deleteData}
            >
              <Text className="text-white">Continue</Text>
            </TouchableOpacity>
          </View>
        </>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
};

export default function DashboardScreen() {
  return (
    <ErrorBoundary
      fallback={
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Text style={{ color: '#dc2626', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Dashboard Error
            </Text>
            <Text style={{ color: '#666', fontSize: 16, textAlign: 'center' }}>
              Something went wrong. Please restart the app.
            </Text>
          </View>
        </SafeAreaView>
      }
    >
      <AnalyticsDashboard />
    </ErrorBoundary>
  );
}

export const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", height: 1050 },
  gauge: {
    position: "absolute",
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    gap: 0,
  },
});
