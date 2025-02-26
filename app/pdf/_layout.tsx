import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Asset } from "expo-asset";

export default function Layout() { 
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
