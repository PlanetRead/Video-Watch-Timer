import { Stack } from "expo-router";
import { useTheme } from "../themeContext";
import React from "react";

export default function Layout() {
  const { isDarkMode } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#F3F4F6' : '#1F2937',
        contentStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        },
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
