import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGIN_STORAGE_KEY = 'admin_logged_in';

const index = () => {
  const id = process.env.EXPO_PUBLIC_ADMIN_ID || '';
  const pass = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || '';

  console.log("Admin ID: ", id ? "Set" : "Not set");
  console.log("Admin Password: ", pass ? "Set" : "Not set");
  const gov_logo = require('@/assets/images/billion_readers.png');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [checkingLogin, setCheckingLogin] = useState(true);
  const router = useRouter();
  const isInitialMountRef = useRef(true);

  // Check if user is already logged in ONLY on initial mount (app startup)
  // Don't auto-redirect if navigating from bird logo or going back
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Only auto-redirect on initial mount (when app starts)
        // If user explicitly navigates to login (e.g., from bird logo), show login screen
        if (isInitialMountRef.current) {
          const isLoggedIn = await AsyncStorage.getItem(LOGIN_STORAGE_KEY);
          if (isLoggedIn === 'true') {
            // User is logged in, redirect to dashboard (only on app startup)
            router.replace('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setCheckingLogin(false);
        // Mark that initial mount check is done
        isInitialMountRef.current = false;
      }
    };

    checkLoginStatus();
  }, [router]);

  const handleLogin = async () => {
    if (!id || !pass) {
      Alert.alert('Error', 'Admin credentials not configured. Please check environment variables.');
      return;
    }
    
    if (adminId === id && password === pass) {
      try {
        // Save login state
        await AsyncStorage.setItem(LOGIN_STORAGE_KEY, 'true');
        console.log("Login successful, navigating to dashboard...");
        router.replace('/dashboard');
      } catch (error) {
        console.error('Error saving login status:', error);
        // Still navigate even if storage fails
        router.replace('/dashboard');
      }
    } else {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  // Show loading indicator while checking login status
  if (checkingLogin) {
    return (
      <SafeAreaView style={{ flex: 1 }} className='bg-purple-700'>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text className='text-white mt-4'>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className='bg-purple-700'>
      <View className='flex-1 items-center h-full justify-center gap-8'>
        <Image source={gov_logo} className="w-[150px] h-[120px]"
          style={{ resizeMode: "contain" }} />
        <View className='w-[80%]'>
          <TextInput
            placeholder="Admin ID"
            value={adminId}
            onChangeText={setAdminId}
            className="w-full bg-white p-3 mt-4 rounded-md"
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="w-full bg-white p-3 mt-4 rounded-md"
          />

          <TouchableOpacity onPress={handleLogin} className="bg-black p-3 rounded-md mt-4 w-full">
            <Text className="text-white text-center font-bold">LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default index