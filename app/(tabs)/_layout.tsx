import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../themeContext';
import React from 'react';

export default function TabLayout() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#6B21A8',
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#F3F4F6' : '#1F2937',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ marginRight: 15 }}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDarkMode ? '#F3F4F6' : '#1F2937'} 
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
