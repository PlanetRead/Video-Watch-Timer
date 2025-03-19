import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { supabase } from "@/utils/SupabaseConfig";
import { getUsers, getVideoAnalyticsByUser } from "@/app/database/database";
import { useSQLiteContext } from "expo-sqlite";

interface User {
    id: string;
    user_name: string;
    pin: number;
    video_analytics?: VideoAnalytics[];
  }
  
  interface VideoAnalytics {
    id: number;
    video_id: number;
    date: string;
    total_views_day: number;
    total_time_day: number;
    last_time_stamp: number | null;
    language: string;
  }

const SyncToCloud = () => {
  const db = useSQLiteContext();
  const fetchUserDetails = async () => {
    console.log("Syncing to cloud...");
    try {
      const users: User[] = await getUsers(db); // Fetch all users
        // Fetch video analytics for each user
        for (const user of users) {
            const videoAnalytics: VideoAnalytics[] = await getVideoAnalyticsByUser(db, user.id);
            user.video_analytics = videoAnalytics;
          }
      console.log(users);
      await syncUsers(users); // Sync users to the cloud
        console.log("Synced to cloud");
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  //@ts-ignore
  async function syncUsers(users) {
    for (const user of users) {
      // Upsert user
      await supabase.from("user").upsert({
        id: user.id,
        user_name: user.user_name,
        pin: user.pin,
      });

      // Upsert video analytics
      for (const analytics of user.video_analytics) {
        const lastTimestamp = analytics.last_time_stamp
          ? new Date(analytics.last_time_stamp).getTime()
          : null;
    
        const { data, error } = await supabase.from("video_analytics").upsert({
          user_id: user.id,
          video_id: analytics.video_id,
          date: analytics.date,
          total_views_day: analytics.total_views_day,
          total_time_day: analytics.total_time_day,
          last_time_stamp: lastTimestamp,
          language: analytics.language,
        }).select();

        console.log(data,error);
      }
    }
  }
  return (
    <View>
      <TouchableOpacity className="bg-[#ECE6F0] my-2 p-3 mt-2 w-full">
        <Text
          className="text-purple-700 text-center font-bold"
          onPress={fetchUserDetails}
        >
          SYNC TO CLOUD
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SyncToCloud;
