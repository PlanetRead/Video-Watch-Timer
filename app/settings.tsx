import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from './themeContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemeToggle from '@/components/ThemeToggle';

export default function SettingsScreen() {
  const { isDark, theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <View className={`p-4 flex-row items-center ${isDark ? 'bg-gray-800' : 'bg-purple-700'}`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#A78BFA' : 'white'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Settings</Text>
      </View>

      {/* Settings Content */}
      <ScrollView className="p-4">
        {/* Theme Section */}
        <View className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Appearance
          </Text>
          
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Dark Mode
            </Text>
            <ThemeToggle showLabel={true} />
          </View>
          
          <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose your preferred theme mode
          </Text>
          
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity 
              onPress={() => setTheme('light')}
              className={`px-4 py-2 rounded-md flex-row items-center ${theme === 'light' ? 'bg-purple-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Ionicons name="sunny-outline" size={18} color={theme === 'light' || !isDark ? 'black' : 'white'} />
              <Text className={`ml-2 ${theme === 'light' ? 'text-white font-bold' : isDark ? 'text-white' : 'text-gray-800'}`}>
                Light
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setTheme('dark')}
              className={`px-4 py-2 rounded-md flex-row items-center ${theme === 'dark' ? 'bg-purple-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Ionicons name="moon-outline" size={18} color={theme === 'dark' || isDark ? 'white' : 'black'} />
              <Text className={`ml-2 ${theme === 'dark' ? 'text-white font-bold' : isDark ? 'text-white' : 'text-gray-800'}`}>
                Dark
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setTheme('system')}
              className={`px-4 py-2 rounded-md flex-row items-center ${theme === 'system' ? 'bg-purple-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Ionicons name="phone-portrait-outline" size={18} color={theme === 'system' ? 'white' : isDark ? 'white' : 'black'} />
              <Text className={`ml-2 ${theme === 'system' ? 'text-white font-bold' : isDark ? 'text-white' : 'text-gray-800'}`}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            About
          </Text>
          <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Video Watch Timer v1.0.0
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            An application to track your video watching habits and analytics.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
} 