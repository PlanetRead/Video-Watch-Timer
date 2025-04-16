import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useEffect } from "react";
import { supabase } from "@/utils/SupabaseConfig";
import { getUsers, getVideoAnalyticsByUser } from "@/app/database/database";
import { useSQLiteContext } from "expo-sqlite";
import { videoDetails } from "@/assets/details";
import { useState } from "react";

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

  // Function to clean error messages
  const cleanErrorMessage = (error: string): string => {
    return error.replace(/(TypeError|Error|SyntaxError|ReferenceError):\s*/gi, '');
  };

  const fetchUserDetails = async () => {
    console.log("Syncing to cloud...");
    setSyncState("inProgress");
    setShowModal(true);
    setErrorMessage("");

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
      const syncResult = await syncUsers(users); // Sync users to the cloud

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

  async function syncUsers(users: User[]) {
    try {
      for (const user of users) {
        // Upsert user
        const { error: userError } = await supabase.from("user").upsert({
          id: user.id,
          user_name: user.user_name,
          pin: user.pin,
        });

        if (userError) {
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

            const { error: analyticsError } = await supabase
              .from("video_analytics")
              .upsert({
                user_id: user.id,
                name:user.user_name,
                video_id: analytics.video_id,
                english_title: analytics.english_title,
                punjabi_title: analytics.punjabi_title,
                level: analytics.level,
                date: analytics.date,
                total_views_day: analytics.total_views_day,
                total_time_day: analytics.total_time_day,
                last_time_stamp: lastTimestamp,
                language: analytics.language,
              });

            if (analyticsError) {
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

  return (
    <View>
      <TouchableOpacity className="bg-[#ECE6F0] p-3 w-full">
        <Text
          className="text-purple-700 text-center font-bold"
          onPress={fetchUserDetails}
        >
          SYNC TO CLOUD
        </Text>
      </TouchableOpacity>

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
