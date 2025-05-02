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
import { create } from "react-test-renderer";


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
    let isMounted = true;
  
    const fetchDetails = async () => {
      if (!userId) return;
  
      try {
        const data: AnalyticsData[] = await getVideoAnalyticsByUser(db, userId);
  
        if (isMounted) {
          // ✅ Always calculate fresh — don't add to previous state
          const totalTime = data.reduce(
            (sum, item) => sum + (item.total_time_day || 0),
            0
          );
          const totalViews = data.reduce(
            (sum, item) => sum + (item.total_views_day || 0),
            0
          );
  
          setTotalTime(totalTime);
          setTotalViews(totalViews);
  
          // 🔗 Merge with video details
          const mergedData = data.map((item) => {
            const videoDetail =
              videoDetails.find(
                (video) => video.id == item.video_id.toString()
              ) || {};
            return { ...item, ...videoDetail };
          });
  
          setAnalyticsData(mergedData);
          // console.log("Analytics Data:", mergedData);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
  
    fetchDetails();
  
    return () => {
      isMounted = false;
    };
  }, [db, userId]); // Added videoDetails just in case
  

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

  function sortDataByLastTimeStamp(filteredData: any[]) {
    return filteredData.sort((a, b) => {
      const dateA = new Date(a.last_time_stamp);
      const dateB = new Date(b.last_time_stamp);
      return dateB.getTime() - dateA.getTime(); // Sort in descending order
    });
  }

  useEffect(() => {
    if (!sortoption) return;
    sortDataByLastTimeStamp(filteredData);
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
    console.log("Sorted Data:", sortedData);
  }, [sortoption]);

  useEffect(() => {
    console.log("AnalyticsDashboard Mounted");

    return () => {
      console.log("AnalyticsDashboard Unmounted");
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
        const itemDate = new Date(item.date); // what does it return? 
        
        
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
    console.log("Filtered Data:", result);
    sortDataByLastTimeStamp(result);
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
    alert("Exporting data to CSV");

    // Convert JSON data to CSV
    const csvContent = Papa.unparse(analyticsData);

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
    try {
      alert("Deleting all user data");
      await deleteAllUserData(db);
      alert("All user data deleted successfully");
      setAnalyticsData([]); // Clear the local state
      setTotalTime(0);
      setTotalViews(0);
    } catch (error) {
      console.error("Error deleting user data:", error);
    }
  }

   // Format date for display
   const formatDate = (date:Date) => {
    if (!date) return "Select";
    return date.toLocaleDateString("en-CA")
  };

  return (
    <SafeAreaView
      style={{ flex: 1, minHeight: height, maxHeight: "auto" }}
      className="bg-white p-4"
    >
      <View className="flex-1">
        <Text className="text-black text-2xl font-black text-center mb-4">
          Analytics
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
          <SyncToCloud />
        </View>
        
        {/* Delete button taking half width */}
        <View className="flex-1">
        <TouchableOpacity 
          className="bg-[#ECE6F0] p-3 w-full" 
          onPress={deleteData}
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
            setValue={(newValue) => setSelectedLevel(newValue)}
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
            setValue={(newValue) => setSelectedLanguage(newValue)}
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

        <FlatList
          data={filteredData}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View className="flex-row justify-between border-b border-white py-2">
              <View className="flex flex-row items-center justify-between border-b-[1px] border-gray-300 h-fit min-h-[130px]">
                <Image
                  source={
                    item.language === "en"
                      ? item.thumbnail_en
                      : item.thumbnail_punjabi
                  }
                  style={{ height: 100, width: "50%" }}
                  resizeMode="contain"
                  className="w-1/2"
                />

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

                    <Text className="text-sm font-bold text-purple-700">
                      Total Views: {item.total_views_day}
                    </Text>

                    <Text className="text-sm font-bold text-purple-700">
                      Watched in:{" "}
                      {item.language === "en" ? "English" : "Punjabi"}
                    </Text>
                    <Text className="text-sm font-bold text-purple-700">
                      Last Watched: {item.date}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
        
      </View>
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
                if (newUsername.trim()) {
                  setUsername(newUsername);
                  deleteData();
                  editUserName(db, userId!, newUsername)
                    .then(() => {
                      setEditSuccess(true);

                      setTimeout(() => {
                        setEditModalVisible(false);
                        setEditSuccess(false);
                      }, 1500);
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


    </SafeAreaView>
  );
};

export default AnalyticsDashboard;

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
