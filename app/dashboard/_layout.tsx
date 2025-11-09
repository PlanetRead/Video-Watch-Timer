import { Stack } from "expo-router";
import React from "react";

export default function Layout() { 
  console.log("Dashboard Layout: Rendering");
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="upload" options={{ headerShown: false }} />
    </Stack>
  );
}
