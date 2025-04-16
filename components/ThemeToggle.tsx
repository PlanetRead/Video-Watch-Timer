import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@/app/themeContext';
import { Ionicons } from '@expo/vector-icons';

type ThemeToggleProps = {
  showLabel?: boolean;
  className?: string;
};

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      className={`flex flex-row items-center space-x-2 p-2 rounded-full ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      } ${className}`}
    >
      <View className="flex items-center justify-center">
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={24}
          color={isDark ? '#FCD34D' : '#F59E0B'}
        />
      </View>
      {showLabel && (
        <Text className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default ThemeToggle; 