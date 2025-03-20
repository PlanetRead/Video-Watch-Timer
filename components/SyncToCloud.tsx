import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { supabase } from "@/utils/SupabaseConfig";
import { getUsers, getVideoAnalyticsByUser } from "@/app/database/database";
import { useSQLiteContext } from "expo-sqlite";
import { videoDetails } from "@/assets/details";

interface User {
  id: string;
  user_name: string;
  pin: number;
  video_analytics?: VideoAnalytics[];
}

interface VideoAnalytics {
  id: number;
  video_id: number;
  english_title?: string;
  punjabi_title?: string;
  level?: string;
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
        const videoAnalytics: VideoAnalytics[] = await getVideoAnalyticsByUser(
          db,
          user.id
        );
        const mergedAnalytics = videoAnalytics.map((item) => {
          const videoDetail =
            videoDetails.find((video) => {
              return video.id === item.video_id.toString();
            }) || {};

          return { ...item, ...videoDetail };
        });
        user.video_analytics = mergedAnalytics;
      }
      console.log(users);
      await syncUsers(users); // Sync users to the cloud
      console.log("Synced to cloud");
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  async function syncUsers(users : User[]) {
    for (const user of users) {
      // Upsert user
      await supabase.from("user").upsert({
        id: user.id,
        user_name: user.user_name,
        pin: user.pin,
      });

      // Upsert video analytics
      if (user.video_analytics?.length) {
      for (const analytics of user.video_analytics) {
        const lastTimestamp = analytics.last_time_stamp
          ? new Date(analytics.last_time_stamp).getTime()
          : null;

        const { data, error } = await supabase
          .from("video_analytics")
          .upsert(
            {
              user_id: user.id,
              video_id: analytics.video_id,
              english_title: analytics.english_title,
              punjabi_title: analytics.punjabi_title,
              level: analytics.level,
              date: analytics.date,
              total_views_day: analytics.total_views_day,
              total_time_day: analytics.total_time_day,
              last_time_stamp: lastTimestamp,
              language: analytics.language,
            },
            { onConflict: ["user_id", "video_id"] }
          ) // Ensure unique combo of user_id & video_id
          .select();

        console.log(data, error);
      }
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
