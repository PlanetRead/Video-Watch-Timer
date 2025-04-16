import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getVideoAnalyticsByUser, getUsers, deleteAllUserData, createUser, editUserName } from "../database/database";
import { useSQLiteContext } from "expo-sqlite";
import { Dimensions } from "react-native";
import { videoDetails } from "../../assets/details";
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
import { Modal } from "react-native";
import { useTheme } from "../themeContext";
import ThemeToggle from "@/components/ThemeToggle";

// Define type for analytics data
type AnalyticsData = {
  id: number;
  video_id: number;
  language: string;
  total_time_day: number;
  total_views_day: number;
  date: string;
  last_time_stamp: number | null;
  user_id?: string;

  english_title?: string;
  punjabi_title?: string;
  thumbnail_en?: any;
  thumbnail_punjabi?: any;
  level?: string;
};

const AnalyticsDashboard = () => {
  const db = useSQLiteContext();
  const { isDark } = useTheme();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

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

   // Add saveUsername function
   const saveUsername = () => {
     if (newUsername.trim() && userId) {
       setUsername(newUsername);
       editUserName(db, userId, newUsername)
         .then(() => {
           setEditSuccess(true);
           setTimeout(() => {
             setEditModalVisible(false);
             setEditSuccess(false);
           }, 1500);
         })
         .catch(error => {
           console.error("Error updating username:", error);
         });
       setNewUsername("");
     }
   };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const users = await getUsers(db); // Fetch all users
        if (users.length > 0) {
          setUserId(users[0].id);
          setUsername(users[0].user_name) // Set the first user's ID
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [db]);

  const [totalTime, setTotalTime] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    let isMounted = true; // Track mounted state

    const fetchDetails = async () => {
      if (!userId) return;
      try {
        const data: AnalyticsData[] = await getVideoAnalyticsByUser(db, userId);

        if (isMounted) {
          setTotalTime(
            data.reduce((sum, item) => sum + (item.total_time_day || 0), 0)
          );
          setTotalViews(
            data.reduce((sum, item) => sum + (item.total_views_day || 0), 0)
          );

          const mergedData = data.map((item) => {
            const videoDetail =
              videoDetails.find(
                (video) => video.id == item.video_id.toString()
              ) || {};
            return { ...item, ...videoDetail };
          });

          setAnalyticsData(mergedData);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false; // Prevent state updates on unmounted component
    };
  }, [db, userId]);

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

    // Level Dropdown State
    const [languageOpen, setLanguageOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("All Lang");
    const [languageItems] = useState([
      { label: "All Lang", value: "All Lang" },
      { label: "English", value: "en" },
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

  useEffect(() => {
    if (!sortoption) return;

    let sortedData = [...filteredData];

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

    setFilteredData(sortedData);
  }, [sortoption]);

  useEffect(() => {
    
    return () => {
      
    };
  }, []);

  const [filteredData, setFilteredData] = useState<AnalyticsData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
        
        // Filter by start date if set
        if (startDate && itemDate < startDate) {
          return false;
        }
        
        // Filter by end date if set
        if (endDate) {
          // Set end date to end of day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (itemDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    }

    setFilteredData(result);
  }, [searchQuery, analyticsData, selectedLevel, startDate, endDate, selectedLanguage]);

  const widthAndHeight = 150;

  const series = [
    { value: 430, color: "#7e22ce" },
    { value: 321, color: "#a347f2" },
    { value: 185, color: "#c76aff" },
    { value: 123, color: "#ed8cff" },
  ];

  const exportData = async () => {
    try {
      if (filteredData.length === 0) {
        console.log("No data to export");
        return;
      }

      // Create CSV content
      const csvData = filteredData.map(item => ({
        'Video Title': item.language === 'en' ? item.english_title : item.punjabi_title,
        'Level': item.level,
        'Language': item.language === 'en' ? 'English' : 'Punjabi',
        'Views': item.total_views_day,
        'Watch Time (sec)': item.total_time_day,
        'Date': item.date
      }));

      const csv = Papa.unparse(csvData);
      
      // Save to file
      const fileUri = FileSystem.documentDirectory + 'analytics_export.csv';
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      
      // Share the file
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Analytics Data' });
      
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const deleteData = async () => {
    try {
      await deleteAllUserData(db);
      setAnalyticsData([]);
      setFilteredData([]);
      setTotalTime(0);
      setTotalViews(0);
      console.log("All data deleted successfully");
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

   // Format date for display
   const formatDate = (date:Date) => {
    if (!date) return "Select";
    return date.toLocaleDateString("en-CA")
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header with username and edit option */}
      <View className={`flex-row justify-between items-center p-4 ${isDark ? 'bg-gray-800' : 'bg-purple-700'}`}>
        <View className="flex-row items-center">
          <Ionicons name="person-circle" size={30} color={isDark ? "#A78BFA" : "white"} />
          <Text className={`text-xl font-bold ml-2 ${isDark ? 'text-white' : 'text-white'}`}>
            {username}
          </Text>
        </View>
        <View className="flex-row">
          <ThemeToggle />
          <TouchableOpacity 
            className="ml-2"
            onPress={() => {
              setEditModalVisible(true);
              setNewUsername(username);
            }}
          >
            <Ionicons name="create-outline" size={25} color={isDark ? "#A78BFA" : "white"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <View className={`flex-row justify-between p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-2`}>
        <View className="flex items-center">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{totalViews}</Text>
          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Total Views</Text>
        </View>
        <View className="flex items-center">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {Math.floor(totalTime / 60)}m {totalTime % 60}s
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Total Watch Time</Text>
        </View>
      </View>
      
      {/* SyncToCloud Component */}
      <View className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-2`}>
        <SyncToCloud />
      </View>

      {/* Search, Filter, and Sort Controls */}
      <View className={`p-3 flex-row flex-wrap items-center gap-2 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-2`}>
        {/* Search Bar */}
        <View className={`flex-row items-center border ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-300'} rounded-full px-3 py-1 flex-1 min-w-[150px]`}>
          <Ionicons name="search" size={20} color={isDark ? "#A78BFA" : "#8B5CF6"} />
          <TextInput
            placeholder="Search videos..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            className={`ml-2 flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
        </View>

        {/* Level Filter Dropdown */}
        <View style={{ zIndex: 3000, minWidth: 120 }}>
          <DropDownPicker
            open={levelOpen}
            value={selectedLevel}
            items={levelItems}
            setOpen={(val) => {
              setLevelOpen(val);
              if (open) setOpen(false);
              if (languageOpen) setLanguageOpen(false);
            }}
            setValue={setSelectedLevel}
            style={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
            }}
            textStyle={{
              color: isDark ? '#F9FAFB' : '#1F2937',
            }}
            dropDownContainerStyle={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
            }}
            theme={isDark ? "DARK" : "LIGHT"}
          />
        </View>

        {/* Language Filter Dropdown */}
        <View style={{ zIndex: 2000, minWidth: 120 }}>
          <DropDownPicker
            open={languageOpen}
            value={selectedLanguage}
            items={languageItems}
            setOpen={(val) => {
              setLanguageOpen(val);
              if (open) setOpen(false);
              if (levelOpen) setLevelOpen(false);
            }}
            setValue={setSelectedLanguage}
            style={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
            }}
            textStyle={{
              color: isDark ? '#F9FAFB' : '#1F2937',
            }}
            dropDownContainerStyle={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
            }}
            theme={isDark ? "DARK" : "LIGHT"}
          />
        </View>
      </View>

      {/* Date Filters and Export */}
      <View className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-2 flex-row justify-between items-center`}>
        <View className="flex-row items-center flex-wrap gap-2">
          {/* Date Range Filters */}
          <TouchableOpacity
            onPress={() => setShowStartDatePicker(true)}
            className={`border px-3 py-2 rounded-md flex-row items-center ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-300'}`}
          >
            <Ionicons name="calendar-outline" size={18} color={isDark ? "#A78BFA" : "#8B5CF6"} />
            <Text className={`ml-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {startDate ? formatDate(startDate) : "Start Date"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndDatePicker(true)}
            className={`border px-3 py-2 rounded-md flex-row items-center ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-300'}`}
          >
            <Ionicons name="calendar-outline" size={18} color={isDark ? "#A78BFA" : "#8B5CF6"} />
            <Text className={`ml-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {endDate ? formatDate(endDate) : "End Date"}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity
              onPress={resetDateFilters}
              className="px-3 py-2 rounded-md bg-red-500 flex-row items-center"
            >
              <Ionicons name="close-circle-outline" size={18} color="white" />
              <Text className="ml-1 text-white">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Export Button */}
        <TouchableOpacity
          onPress={exportData}
          className="px-3 py-2 rounded-md bg-green-600 flex-row items-center"
        >
          <Ionicons name="download-outline" size={18} color="white" />
          <Text className="ml-1 text-white">Export CSV</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sort Dropdown */}
      <View className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md mb-2 z-20`} style={{ zIndex: 1000 }}>
        <View style={{ maxWidth: 200 }}>
          <DropDownPicker
            open={open}
            value={sortoption}
            items={items}
            setOpen={(val) => {
              setOpen(val);
              if (levelOpen) setLevelOpen(false);
              if (languageOpen) setLanguageOpen(false);
            }}
            setValue={setSortOption}
            placeholder="Sort by..."
            style={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
            }}
            textStyle={{
              color: isDark ? '#F9FAFB' : '#1F2937',
            }}
            dropDownContainerStyle={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
            }}
            theme={isDark ? "DARK" : "LIGHT"}
          />
        </View>
      </View>

      {/* Video List */}
      <FlatList
        data={filteredData}
        className="z-10"
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View 
            className={`p-4 mx-3 my-2 rounded-xl flex-row ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <Image
              source={item.language === "en" ? item.thumbnail_en : item.thumbnail_punjabi}
              className="w-[80px] h-[80px] rounded-md mr-3"
              style={styles.thumbnail}
            />
            <View className="flex-1 justify-center">
              <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {item.language === "en" ? item.english_title : item.punjabi_title}
              </Text>
              <View className="flex-row justify-between items-center mt-1">
                <View className="flex-row items-center">
                  <Ionicons name="eye-outline" size={16} color={isDark ? "#A78BFA" : "#8B5CF6"} />
                  <Text className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.total_views_day} views</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color={isDark ? "#A78BFA" : "#8B5CF6"} />
                  <Text className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {Math.floor(item.total_time_day / 60)}m {item.total_time_day % 60}s
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color={isDark ? "#A78BFA" : "#8B5CF6"} />
                  <Text className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.date}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Username Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`p-6 rounded-lg w-[80%] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Edit Username
            </Text>
            <TextInput
              className={`border p-2 rounded-md mb-4 ${isDark ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300 text-gray-800'}`}
              placeholder="Enter new username"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={newUsername}
              onChangeText={setNewUsername}
            />
            {editSuccess && (
              <Text className="text-green-500 mb-2">Username updated successfully!</Text>
            )}
            <View className="flex-row justify-end">
              <TouchableOpacity
                className="px-4 py-2 rounded-md bg-gray-500 mr-2"
                onPress={() => {
                  setEditModalVisible(false);
                  setEditSuccess(false);
                }}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded-md bg-purple-600"
                onPress={saveUsername}
              >
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Data Button - Admin Access Only */}
      <View className="p-4 flex items-center">
        <TouchableOpacity
          className="px-4 py-2 rounded-md bg-red-600 flex-row items-center"
          onPress={deleteData}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
          <Text className="ml-1 text-white">Delete All Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
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
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    resizeMode: "contain",
  },
});

export default AnalyticsDashboard;
