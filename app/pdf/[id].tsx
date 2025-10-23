import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Text } from 'react-native';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset'; // This is the key
import { useLocalSearchParams } from 'expo-router';
import { videoDetails } from '../../assets/details';

const PdfViewer = () => {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();

  const video = videoDetails.find((v) => v.id === id);
  const pdfAsset = video ? (language === "pa" ? video.pdf_punjabi : video.pdf_en) : null;
  const title = video ? (language === "pa" ? video.punjabi_title : video.english_title) : 'PDF Viewer';

  useEffect(() => {
    const loadPdf = async () => {
      try {
        console.log("🔄 Starting to load PDF...");
        
        // Check if pdfAsset is valid
        if (!pdfAsset) {
          Alert.alert('Error', 'PDF asset definition not found');
          console.error('❌ PDF asset definition not found in videoDetails');
          setLoading(false);
          return;
        }
        
        // THIS IS THE FIX: pdfAsset is ALREADY an Asset object.
        // We do NOT need Asset.fromModule().
        const asset = pdfAsset; 
        
        console.log("🔽 Downloading asset...");
        await asset.downloadAsync();
        console.log("📂 Asset local URI:", asset.localUri || asset.uri);

        const fileUri = `${FileSystem.cacheDirectory}${video?.id}_${language}.pdf`;
        const fileExists = await FileSystem.getInfoAsync(fileUri);

        if (!fileExists.exists) {
          console.log("🚀 Copying file to cache...");
          await FileSystem.copyAsync({ from: asset.localUri || asset.uri, to: fileUri });
        } else {
          console.log("✅ File already in cache");
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
  }, [pdfAsset]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      {/* Header */}
      <View className="flex-row items-center justify-start p-2 bg-white shadow-2xl pt-12 elevation-lg">
        <Text className="text-lg font-bold text-black ml-2">
          {title || 'PDF Viewer'}
        </Text>
      </View>

      {/* Content */}
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
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">Could not load PDF.</Text>
        </View>
      )}
    </View>
  );
};

export default PdfViewer;