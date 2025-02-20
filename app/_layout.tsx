import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';



export default function RootLayout() {
  return (<>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="video" options={{ headerShown: false }} />
      <Stack.Screen name="pdf" options={{ headerShown: false }} />
    </Stack>
    <StatusBar style="light" />
  </>

  );
}
