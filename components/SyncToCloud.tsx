// No UI imports needed - completely invisible component
import React, { useEffect, useRef } from "react";
import { supabase } from "@/utils/SupabaseConfig";
import { getUsers, getVideoAnalyticsByUser } from "@/app/database/database";
import { useSQLiteContext } from "expo-sqlite";
import { videoDetails } from "@/assets/details";
import { useNetInfo } from "@react-native-community/netinfo";
// No useState needed - completely invisible component
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  user_name: string;
  pin: number;
  video_analytics?: VideoAnalytics[];
}

interface VideoAnalytics {
  id: number;
  name:string;
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
  const netInfo = useNetInfo();
  const wasConnected = useRef<boolean | null>(null);
  // No UI state needed - completely invisible component
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(0);
  const SYNC_DEBOUNCE_TIME = 30000; // 30 seconds minimum between syncs

  // Periodic sync when connected to internet (every 5 minutes)
  useEffect(() => {
    if (netInfo.isConnected) {
      // Set up periodic sync every 5 minutes
      syncIntervalRef.current = setInterval(() => {
        console.log("Periodic sync triggered.");
        fetchUserDetails("periodic");
      }, 5 * 60 * 1000); // 5 minutes
    } else {
      // Clear interval when disconnected
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [netInfo.isConnected]);

  // Listen for sync triggers from other parts of the app
  useEffect(() => {
    const checkSyncTrigger = async () => {
      try {
        const triggerValue = await AsyncStorage.getItem('triggerSync');
        if (triggerValue && netInfo.isConnected) {
          console.log("Sync triggered by analytics update.");
          await AsyncStorage.removeItem('triggerSync'); // Clear the trigger
          fetchUserDetails("analytics_update");
        }
      } catch (error) {
        console.error("Error checking sync trigger:", error);
      }
    };

    // Check for sync triggers every 5 seconds (optimized frequency)
    const interval = setInterval(checkSyncTrigger, 5000);

    return () => clearInterval(interval);
  }, [netInfo.isConnected]);

  useEffect(() => {
    // Check if the device just came online
    if (netInfo.isConnected && wasConnected.current === false) {
      console.log("Internet connection restored. Starting automatic sync.");
      fetchUserDetails("connection_restored");
    }
    // Also sync when app starts and internet is already available
    else if (netInfo.isConnected && wasConnected.current === null) {
      console.log("App started with internet connection. Starting automatic sync.");
      // Add a small delay to ensure the app is fully initialized
      setTimeout(() => {
        fetchUserDetails("app_start");
      }, 2000);
    }
    // Update the previous connection state
    wasConnected.current = netInfo.isConnected;
  }, [netInfo.isConnected]);

  // No error message cleaning needed - completely invisible component

  const fetchUserDetails = async (triggeredBy: string = "unknown") => {
    // Debounce sync to prevent too frequent syncs
    const now = Date.now();
    if (now - lastSyncTime.current < SYNC_DEBOUNCE_TIME) {
      console.log(`Sync debounced. Last sync was ${Math.round((now - lastSyncTime.current) / 1000)}s ago.`);
      return;
    }

    console.log(`Sync triggered by: ${triggeredBy}`);
    lastSyncTime.current = now;

    console.log("Syncing to cloud...");

    try {
      const users: User[] = await getUsers(db); // Fetch all users

      // Fetch video analytics for each user
      await Promise.all(users.map(async (user) => {
        const videoAnalytics: VideoAnalytics[] = await getVideoAnalyticsByUser(
          db,
          user.id
        );
        user.video_analytics = videoAnalytics.map((item) => {
          const videoDetail =
            videoDetails.find((video) => {
              return video.id === item.video_id.toString();
            }) || {};

          return { ...item, ...videoDetail };
        });
      }));

      console.log(users);
      const syncResult = await syncUsers(users); // Sync users to the cloud

      if (syncResult.success) {
        console.log("Synced to cloud successfully");
      } else {
        console.error("Error syncing to cloud:", syncResult.error);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  async function syncUsers(users: User[]) {
    try {
      // 1. Upsert all users in a single batch
      const userUpsertData = users.map(user => ({
        id: user.id,
        user_name: user.user_name,
        pin: user.pin,
      }));

      const { error: usersError } = await supabase.from("user").upsert(userUpsertData);
      if (usersError) {
        return { success: false, error: `Error syncing users: ${usersError.message}` };
      }

      // 2. Collect all video analytics from all users
      const allAnalytics = users.flatMap(user =>
        user.video_analytics?.map(analytics => {
          const lastTimestamp = analytics.last_time_stamp
            ? new Date(analytics.last_time_stamp).toISOString() // Use ISO string for consistency
            : null;

          return {
            user_id: user.id,
            name: user.user_name,
            video_id: analytics.video_id,
            english_title: analytics.english_title,
            punjabi_title: analytics.punjabi_title,
            level: analytics.level,
            date: analytics.date,
            total_views_day: analytics.total_views_day,
            total_time_day: analytics.total_time_day,
            last_time_stamp: lastTimestamp,
            language: analytics.language,
          };
        }) ?? []
      );

      // 3. Upsert all analytics in a single batch
      if (allAnalytics.length > 0) {
        const { error: analyticsError } = await supabase
          .from("video_analytics")
          .upsert(allAnalytics, { onConflict: 'user_id,video_id,date,language' });

        if (analyticsError) {
          return { success: false, error: `Error syncing analytics: ${analyticsError.message}` };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred during sync",
      };
    }
  }

  // No modal functions needed - completely invisible component

  // Completely invisible component - no UI, just background sync
  return null;
};

export default SyncToCloud;
