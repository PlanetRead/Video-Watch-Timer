import { View, Text, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import Pdf from 'react-native-pdf';
import { videoDetails } from "@/assets/details";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';

const PdfRead = () => {
    const { id, language } = useLocalSearchParams<{ id?: string; language?: string }>();
    const video = videoDetails.find((v) => v.id === id);
    const pdfUri = language === "pa" ? video?.pdf_punjabi : video?.pdf_en;
    const PdfResource = pdfUri;

    if (!video) {
        return (
          <View>
            <Text style={styles.errorText}>Video not found</Text>
          </View>
        );
      }

    return (
        <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
            <Pdf
                trustAllCerts={false}
                source={PdfResource}
                style={styles.pdf}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`number of pages: ${numberOfPages}`);
                }}
            />
        </View>
        </SafeAreaView>
    )
}

export default PdfRead

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 25,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 10
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    errorText: {
        fontSize: 18,
        color: "red",
      },
})