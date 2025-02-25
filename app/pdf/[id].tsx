import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Text, TouchableOpacity, Image } from 'react-native';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { videoDetails } from '../../assets/details';

const PdfViewer = () => {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();

  const video = videoDetails.find((v) => v.id === id);
  const pdf = video ? (language === "pa" ? video.pdf_punjabi : video.pdf_en) : null;
  const title = video ? (language === "pa" ? video.punjabi_title : video.english_title) : 'PDF Viewer';
  const back = require('@/assets/images/back.png');

  useEffect(() => {
    const loadPdf = async () => {
      try {
        console.log("🔄 Starting to load PDF...");

        // Load the asset
        const asset = pdf;
        if (!asset) {
          Alert.alert('Error', 'PDF not found');
          console.error('❌ PDF not found');
          return;
        }
        await asset.downloadAsync();

        console.log("📂 Asset path:", asset.uri);
        const fileUri = `${FileSystem.cacheDirectory}${video?.id}_${language}.pdf`;
        // Check if file exists, else copy it
        const fileExists = await FileSystem.getInfoAsync(fileUri);
        if (!fileExists.exists) {
          console.log("🚀 Copying file to cache...");
          await FileSystem.copyAsync({ from: asset.uri, to: fileUri });
        } else {
          console.log("✅ File already exists in cache");
        }

        console.log("✅ PDF successfully loaded:", fileUri);
        setPdfUri(fileUri);
      } catch (error) {
        Alert.alert('Error', 'Failed to load PDF');
        console.error('Error loading PDF:', error);
      }
      setLoading(false);
    };

    loadPdf();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      {/* Header with Back Button and Title */}
      <View className="flex-row items-center justify-start p-2 bg-white shadow-2xl pt-12 elevation-lg">
  {/* <TouchableOpacity onPress={() => router.push("/")} className="p-2">
    <Image 
      source={back} 
      className="w-6 h-6" 
      resizeMode="contain" 
    />
  </TouchableOpacity> */}
  <Text className="text-lg font-bold text-black ml-2">
    {title || 'PDF Viewer'}
  </Text>
</View>


      {loading ? (
        <ActivityIndicator size="large" color="blue" style={{ flex: 1 }} />
      ) : pdfUri ? (
        <Pdf
          source={{ uri: pdfUri }}
          style={{ flex: 1 }}
          enablePaging={true}
          onLoadComplete={(numberOfPages) =>
            console.log(`📄 PDF Loaded with ${numberOfPages} pages`)
          }
          onError={(error) => console.log("❌ Error loading PDF:", error)}
        />
      ) : (
        <View />
      )}
    </View>
  );
};

export default PdfViewer;
