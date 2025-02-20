import { View, TouchableOpacity, Text, Dimensions, SafeAreaView,Image } from 'react-native';
import React, { useCallback } from 'react';
import Pdf from 'react-native-pdf';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { videoDetails } from '@/assets/details';
import { StatusBar } from 'expo-status-bar';

const PdfRead = () => {
  const router = useRouter();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
  
  // Fetch the video details respective to the route id
  const video = videoDetails.find((v) => v.id === id);
  const pdfUrl = language === "pa" ? video?.pdf_punjabi : video?.pdf_en;
  
  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePdfError = useCallback((error: any) => {
    console.error('PDF Error:', error);
  }, []);

  const handleLoadComplete = useCallback((numberOfPages: any, filePath: any) => {
    console.log(`PDF Loaded: ${numberOfPages} pages`);
  }, []);


  // if pdf is not available or path is not found then show pdf not found
  if (!pdfUrl) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <View>
        <Text className="text-lg text-gray-700">PDF not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Header */}
      <View className="flex-row items-center justify-start p-4 border-b border-gray-200 pt-14 px-6 gap-6">
        <TouchableOpacity onPress={handleBack}>
          <Image source={require('@/assets/images/back.png')} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>
        <Text className="text-xl font-bold">{language === "pa" ? video?.punjabi_title : video?.english_title}</Text>
        </View>

      {/* PDF Viewer */}
      <View className="flex-1">
        <Pdf
          source={pdfUrl}
          trustAllCerts={false}
          fitPolicy={0} // fit width
          style={{
            flex: 1,
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
          }}
          onLoadComplete={handleLoadComplete}
          onError={handlePdfError}
          enablePaging={true}
          renderActivityIndicator={() => (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-600">Loading PDF...</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default PdfRead;