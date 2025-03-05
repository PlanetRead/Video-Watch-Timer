import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

const index = () => {
  const id = "1234";
  const pass ="1234";
  const gov_logo = require('@/assets/images/gov_logo.png');
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
    <SafeAreaView style={{ flex: 1 }} className='bg-purple-700'>
      <View className='flex-1 items-center h-full justify-center gap-16'>
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