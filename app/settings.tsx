import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './themeContext';
import ThemeToggle from '../components/ThemeToggle';

const SettingsScreen = () => {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  
  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerTitleStyle: { 
            color: isDarkMode ? '#F3F4F6' : '#1F2937'
          },
          headerStyle: { 
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF'
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              className="ml-4"
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={isDarkMode ? '#F3F4F6' : '#1F2937'} 
              />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView className="flex-1">
        <View className={`px-4 py-6 mb-4 ${isDarkMode ? 'bg-surface-dark' : 'bg-surface-light'}`}>
          <Text className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-text-dark' : 'text-text-light'}`}>
            Appearance
          </Text>
          <Text className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Customize the app's appearance
          </Text>
          
          <View className="flex-row items-center justify-between py-4">
            <Text className={`text-base ${isDarkMode ? 'text-text-dark' : 'text-text-light'}`}>
              Theme
            </Text>
            <ThemeToggle />
          </View>
          
          <View className={`mt-2 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You can choose between Light, Dark, or System theme. The System option will follow your device's theme settings.
            </Text>
          </View>
        </View>
        
        <View className={`px-4 py-6 ${isDarkMode ? 'bg-surface-dark' : 'bg-surface-light'}`}>
          <Text className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-text-dark' : 'text-text-light'}`}>
            About
          </Text>
          <Text className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Information about this app
          </Text>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <Text className={`text-base ${isDarkMode ? 'text-text-dark' : 'text-text-light'}`}>
              Version
            </Text>
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              1.0.0
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between py-3">
            <Text className={`text-base ${isDarkMode ? 'text-text-dark' : 'text-text-light'}`}>
              Made with
            </Text>
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ❤️ in India
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen; 