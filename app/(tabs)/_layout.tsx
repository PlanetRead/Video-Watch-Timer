import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { View, Image } from "react-native";
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

export default function Layout() {
  const [isLoading, setIsLoading] = useState(true);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start animation
    scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
    opacity.value = withTiming(1, { duration: 1200 });

    setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Show splash for 3 seconds
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const splash_img = require('@/assets/images/splash_img.png');

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#6B21A8" }}>
        <Animated.Image source={splash_img} style={[{ width: 400, height: 400 }, animatedStyle]} resizeMode="contain" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
