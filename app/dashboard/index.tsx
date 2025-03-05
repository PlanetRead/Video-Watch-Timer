import { View, Text, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVideoAnalyticsByUser,getUsers } from '../database/database';
import { useSQLiteContext } from 'expo-sqlite';

// Define type for analytics data
type AnalyticsData = {
  id: number;
  video_id: number;
  language: string;
  total_time_day: number;
  total_views_day: number;
  date: string;
  last_time_stamp: number | null;
  user_id?: string; // Mark as optional
};


const AnalyticsDashboard = () => {
  const db = useSQLiteContext();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const users = await getUsers(db); // Fetch all users
        if (users.length > 0) {
          setUserId(users[0].id); // Set the first user's ID
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [db]);

  useEffect(() => {
    if (!userId) return;

    const fetchDetails = async () => {
      try {
        const data: AnalyticsData[] = await getVideoAnalyticsByUser(db, userId);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchDetails();
  }, [db, userId]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-purple-700 p-4">
      <View className="flex-1">
        <Text className="text-white text-2xl font-black text-center mb-4">Analytics Dashboard</Text>

        {/* Table Header */}
        <View className="flex-row justify-between border-b-2 border-white pb-2">
          <Text className="text-white font-bold w-1/6 text-center">Video ID</Text>
          <Text className="text-white font-bold w-1/6 text-center">Lang</Text>
          <Text className="text-white font-bold w-1/6 text-center">Watched</Text>
          <Text className="text-white font-bold w-1/6 text-center">Clicks</Text>
          <Text className="text-white font-bold w-1/6 text-center">Date</Text>
        </View>

        {/* Table Data */}
        <FlatList
          data={analyticsData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row justify-between border-b border-white py-2">
              <Text className="text-white w-1/6 text-center">{item.video_id}</Text>
              <Text className="text-white w-1/6 text-center">{item.language}</Text>
              <Text className="text-white w-1/6 text-center">{item.total_time_day} min</Text>
              <Text className="text-white w-1/6 text-center">{item.total_views_day}</Text>
              <Text className="text-white w-1/6 text-center">{item.date}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default AnalyticsDashboard;
