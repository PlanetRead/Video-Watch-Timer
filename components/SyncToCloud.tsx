import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from "react-native";
import React, { useEffect, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/utils/SupabaseConfig";
import { getUsers, getVideoAnalyticsByUser, getAllVideos, getVideoById } from "@/app/database/database";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { videoDetails } from "@/assets/details";

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
  const [syncState, setSyncState] = useState<
    "idle" | "inProgress" | "success" | "failure"
  >("idle");
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);
  
  // Check if database is available - but hooks must be called first
  if (!db) {
    return (
      <View>
        <Text style={{ color: '#dc2626', textAlign: 'center', padding: 10 }}>
          Database not available
        </Text>
      </View>
    );
  }

  // Function to clean error messages
  const cleanErrorMessage = (error: string): string => {
    return error.replace(/(TypeError|Error|SyntaxError|ReferenceError):\s*/gi, '');
  };

  const fetchUserDetails = async () => {
    if (!supabase) {
      setShowModal(true);
      setSyncState("failure");
      setErrorMessage("Cloud sync is disabled because Supabase credentials are not configured.");
      return;
    }

    console.log("Syncing to cloud...");
    setSyncState("inProgress");
    setShowModal(true);
    setErrorMessage("");

    try {
      const users: User[] = await getUsers(db); // Fetch all users
      const allVideos = await getAllVideos(db); // Fetch all uploaded videos

      // Fetch video analytics for each user and enrich with titles
      for (const user of users) {
        const videoAnalytics: VideoAnalytics[] = await getVideoAnalyticsByUser(
          db,
          user.id
        );
        
        // Enrich analytics with titles from videos table or videoDetails
        for (const analytics of videoAnalytics) {
          // Try to find title from uploaded videos table first
          const uploadedVideo = allVideos.find(v => v.id === analytics.video_id);
          
          if (uploadedVideo) {
            // For uploaded videos, use the title as english_title
            analytics.english_title = uploadedVideo.title;
            analytics.punjabi_title = uploadedVideo.title; // Use same title for both if no translation
            analytics.level = uploadedVideo.level || "1";
          } else {
            // For predefined videos, look up from videoDetails
            const videoDetail = videoDetails.find(v => v.id === analytics.video_id.toString());
            if (videoDetail) {
              analytics.english_title = videoDetail.english_title?.trim() || "Unknown Title";
              analytics.punjabi_title = videoDetail.punjabi_title?.trim() || "Unknown Title";
              analytics.level = videoDetail.level || "1";
            } else {
              // Fallback: provide default values to prevent null constraint violation
              analytics.english_title = `Video ${analytics.video_id}`;
              analytics.punjabi_title = `Video ${analytics.video_id}`;
              analytics.level = analytics.level || "1";
            }
          }
        }
        
        user.video_analytics = videoAnalytics;
      }

      console.log(users);
      const syncResult = await syncUsers(users, supabase); // Sync users to the cloud

      if (syncResult.success) {
        console.log("Synced to cloud successfully");
        setSyncState("success");
      } else {
        console.error("Error syncing to cloud:", syncResult.error);
        setErrorMessage(
          syncResult.error
            ? cleanErrorMessage(syncResult.error)
            : "Unknown error occurred"
        );
        setSyncState("failure");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      const errorMsg =
        error instanceof Error ? error.
        message : "Unknown error occurred";
      setErrorMessage(cleanErrorMessage(errorMsg));
      setSyncState("failure");
    }
  };

  async function syncUsers(users: User[], supabaseClient: SupabaseClient) {
    try {
      for (const user of users) {
        // Upsert user
        const { error: userError } = await supabaseClient.from("user").upsert({
          id: user.id,
          user_name: user.user_name,
          pin: user.pin,
        });

        if (userError) {
          console.error("Supabase user upsert error:", userError);
          return {
            success: false,
            error: `Error syncing data: ${userError.message}`,
          };
        }

        // Upsert video analytics
        if (user.video_analytics?.length) {
          for (const analytics of user.video_analytics) {
            const lastTimestamp = analytics.last_time_stamp
              ? new Date(analytics.last_time_stamp).getTime()
              : null;

            const { error: analyticsError } = await supabaseClient
              .from("video_analytics")
              .upsert(
                [
                  {
                    user_id: user.id,
                    name:user.user_name,
                    video_id: analytics.video_id,
                    english_title: analytics.english_title || `Video ${analytics.video_id}`,
                    punjabi_title: analytics.punjabi_title || `Video ${analytics.video_id}`,
                    level: analytics.level || "1",
                    date: analytics.date,
                    total_views_day: analytics.total_views_day,
                    total_time_day: analytics.total_time_day,
                    last_time_stamp: lastTimestamp,
                    language: analytics.language,
                  }
                ],
                {
                  onConflict: 'user_id,video_id,date,language',
              });

            if (analyticsError) {
              console.error("Supabase analytics upsert error:", analyticsError);
              return {
                success: false,
                error: `Error syncing analytics for video ${analytics.video_id}: ${analyticsError.message}`,
              };
            }
          }
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

  const closeModal = () => {
    setShowModal(false);
    setSyncState("idle");
  };

  // Check network connectivity
  const checkNetworkConnectivity = async (): Promise<boolean> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch("https://www.google.com/generate_204", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeout);
        return response.ok;
      } catch (error) {
        clearTimeout(timeout);
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_API_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.warn("Supabase credentials not configured, skipping connectivity check.");
        return false;
      }

      const healthEndpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/health`;
      const controllerSupabase = new AbortController();
      const timeoutSupabase = setTimeout(() => controllerSupabase.abort(), 8000);

      try {
        const response = await fetch(healthEndpoint, {
          method: "GET",
          cache: "no-store",
          signal: controllerSupabase.signal,
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        clearTimeout(timeoutSupabase);

        if (!response.ok) {
          const body = await response.text();
          console.warn("Supabase health check responded with non-200 status", {
            status: response.status,
            body,
          });
          return false;
        }

        return true;
      } catch (error) {
        clearTimeout(timeoutSupabase);
        console.warn("Supabase connectivity check failed:", error);
        return false;
      }
  };

  // Auto-sync function (same as manual sync but without showing modal)
  const autoSync = async (silent: boolean = true) => {
    if (isSyncingRef.current) return; // Prevent multiple simultaneous syncs
    
    // Check if we've synced recently (within last 30 seconds)
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 30000) {
      return; // Skip if synced recently
    }

    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      console.log("No internet connection, skipping auto-sync");
      return;
    }

    isSyncingRef.current = true;
    lastSyncTimeRef.current = now;

    if (!supabase) {
      return;
    }

    try {
      const users: User[] = await getUsers(db);
      const allVideos = await getAllVideos(db); // Fetch all uploaded videos

      // Fetch video analytics for each user and enrich with titles
      for (const user of users) {
        const videoAnalytics: VideoAnalytics[] = await getVideoAnalyticsByUser(
          db,
          user.id
        );
        
        // Enrich analytics with titles from videos table or videoDetails
        for (const analytics of videoAnalytics) {
          // Try to find title from uploaded videos table first
          const uploadedVideo = allVideos.find(v => v.id === analytics.video_id);
          
          if (uploadedVideo) {
            // For uploaded videos, use the title as english_title
            analytics.english_title = uploadedVideo.title;
            analytics.punjabi_title = uploadedVideo.title; // Use same title for both if no translation
            analytics.level = uploadedVideo.level || "1";
          } else {
            // For predefined videos, look up from videoDetails
            const videoDetail = videoDetails.find(v => v.id === analytics.video_id.toString());
            if (videoDetail) {
              analytics.english_title = videoDetail.english_title?.trim() || "Unknown Title";
              analytics.punjabi_title = videoDetail.punjabi_title?.trim() || "Unknown Title";
              analytics.level = videoDetail.level || "1";
            } else {
              // Fallback: provide default values to prevent null constraint violation
              analytics.english_title = `Video ${analytics.video_id}`;
              analytics.punjabi_title = `Video ${analytics.video_id}`;
              analytics.level = analytics.level || "1";
            }
          }
        }
        
        user.video_analytics = videoAnalytics;
      }

      const syncResult = await syncUsers(users, supabase);

      if (syncResult.success) {
        console.log("Auto-synced to cloud successfully");
        if (!silent) {
          setSyncState("success");
          setShowModal(true);
          setTimeout(() => {
            closeModal();
          }, 2000);
        }
      } else {
        console.error("Auto-sync failed:", syncResult.error);
      }
    } catch (error) {
      console.error("Error during auto-sync:", error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Monitor network connectivity and auto-sync
  useEffect(() => {
    if (!autoSyncEnabled || !db) return;

    let interval: NodeJS.Timeout | null = null;
    let subscription: any = null;

    const checkAndSync = async () => {
      if (!autoSyncEnabled || !db) return;
      
      try {
        const isOnline = await checkNetworkConnectivity();
        if (isOnline && !isSyncingRef.current) {
          await autoSync(true);
        }
      } catch (error) {
        console.error("Error in checkAndSync:", error);
      }
    };

    // Check immediately with a small delay to ensure db is ready
    const initialTimeout = setTimeout(() => {
      checkAndSync();
    }, 1000);

    // Check periodically (every 2 minutes)
    interval = setInterval(checkAndSync, 120000);

    // Check when app comes to foreground
    subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && autoSyncEnabled) {
        // Add a small delay when app becomes active
        setTimeout(() => {
          checkAndSync();
        }, 500);
      }
    });

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
      if (subscription) subscription.remove();
    };
  }, [autoSyncEnabled]);

  return (
    <View>
      <View className="flex-row gap-2 mb-2">
        <TouchableOpacity className="bg-[#ECE6F0] p-3 flex-1" onPress={fetchUserDetails}>
          <Text className="text-purple-700 text-center font-bold">
            SYNC TO CLOUD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`p-3 flex-1 ${autoSyncEnabled ? "bg-purple-700" : "bg-gray-300"}`}
          onPress={() => setAutoSyncEnabled(!autoSyncEnabled)}
        >
          <Text className={`text-center font-bold ${autoSyncEnabled ? "text-white" : "text-gray-700"}`}>
            AUTO SYNC {autoSyncEnabled ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Sync Progress */}
      <Modal
        transparent={true}
        visible={showModal}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className=" flex-1 bg-red-600 justify-center items-center">
          <View
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 16,
              width: "80%",
              minHeight: 200,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              marginTop: -50,
            }}
            className="bg-white p-6 rounded-lg w-4/5 items-center"
          >
            {syncState === "inProgress" && (
              <>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="mt-4 text-gray-700 font-medium text-center">
                  Syncing data to cloud...
                </Text>
              </>
            )}

            {syncState === "success" && (
              <>
                <Text className="text-green-600 font-bold text-lg mb-2">
                  Success!
                </Text>
                <Text className="text-gray-700 text-center mb-4">
                  All data has been successfully synced to the cloud.
                </Text>
                <TouchableOpacity
                  className="bg-purple-600 py-2 px-6 rounded-md mt-2"
                  onPress={closeModal}
                >
                  <Text className="text-black font-bold">Close</Text>
                </TouchableOpacity>
              </>
            )}

            {syncState === "failure" && (
              <>
                <Text className="text-red-600 font-bold text-lg mb-2">
                  Error
                </Text>
                <Text className="text-gray-700 text-center mb-4">
                  {errorMessage ||
                    "Failed to sync data. Please check your connection and try again."}
                </Text>
                <TouchableOpacity
                  className="bg-purple-600 py-2 px-6 rounded-md mt-2"
                  onPress={closeModal}
                >
                  <Text className="text-black font-bold">Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SyncToCloud;
