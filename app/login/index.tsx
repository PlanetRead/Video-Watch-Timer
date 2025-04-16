import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useTheme } from '../themeContext';

const index = () => {
  const id = process.env.EXPO_PUBLIC_ADMIN_ID
  const pass = process.env.EXPO_PUBLIC_ADMIN_PASSWORD
  const { isDarkMode } = useTheme();

  const gov_logo = require('@/assets/images/billion_readers.png');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (adminId === id && password === pass) {
      router.push('/dashboard');
    } else {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className={`${isDarkMode ? 'bg-background-dark' : 'bg-purple-700'}`}>
      <View className='flex-1 items-center h-full justify-center gap-8'>
        <Image source={gov_logo} className="w-[150px] h-[120px]"
          style={{ resizeMode: "contain" }} />
        <View className='w-[80%]'>
          <TextInput
            placeholder="Admin ID"
            value={adminId}
            onChangeText={setAdminId}
            className={`w-full p-3 mt-4 rounded-md ${isDarkMode ? 'bg-gray-800 text-text-dark border-gray-700 border' : 'bg-white text-black'}`}
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className={`w-full p-3 mt-4 rounded-md ${isDarkMode ? 'bg-gray-800 text-text-dark border-gray-700 border' : 'bg-white text-black'}`}
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />

          <TouchableOpacity 
            onPress={handleLogin} 
            className={`${isDarkMode ? 'bg-primary-dark' : 'bg-black'} p-3 rounded-md mt-4 w-full`}
          >
            <Text className="text-white text-center font-bold">LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default index