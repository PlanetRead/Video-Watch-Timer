import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

const index = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} className='bg-purple-700'>
      <View className='flex-1 items-center h-full justify-center gap-16'>
       <Text className='text-white text-2xl font-black'>Analytics Dashboard</Text>
      </View>
    </SafeAreaView>
  )
}

export default index