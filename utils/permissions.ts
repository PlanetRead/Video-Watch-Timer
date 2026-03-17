import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { PermissionStatus } from 'expo-media-library';
import { Platform, Alert, Linking } from 'react-native';

/**
 * Request media library permissions automatically
 * Returns true if granted, false otherwise
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        return true;
      } else if (status === 'denied') {
        // Open settings if permission is denied
        Alert.alert(
          'Permission Required',
          'This app needs access to your photo library to upload videos. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
    } else {
      // Android - MediaLibrary permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === PermissionStatus.GRANTED) {
        return true;
      } else if (status === PermissionStatus.DENIED) {
        Alert.alert(
          'Permission Required',
          'This app needs access to your storage to upload videos. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
};

/**
 * Check if media library permissions are granted
 */
export const checkMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === PermissionStatus.GRANTED;
    }
  } catch (error) {
    console.error('Error checking media library permissions:', error);
    return false;
  }
};

/**
 * Request camera permissions (for taking photos as thumbnails)
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      return true;
    } else if (status === 'denied') {
      Alert.alert(
        'Permission Required',
        'This app needs access to your camera to take photos. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    return false;
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

/**
 * Check if camera permissions are granted
 */
export const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return false;
  }
};

/**
 * Request all necessary permissions for video upload
 * This is called automatically when needed
 */
export const requestAllUploadPermissions = async (): Promise<boolean> => {
  try {
    // Request media library permissions (for selecting videos and thumbnails)
    const mediaLibraryGranted = await requestMediaLibraryPermissions();
    
    // Note: Camera permission is requested only when user wants to take a photo
    // We don't request it here as it's optional
    
    return mediaLibraryGranted;
  } catch (error) {
    console.error('Error requesting upload permissions:', error);
    return false;
  }
};

/**
 * Check if all necessary permissions for upload are granted
 */
export const checkAllUploadPermissions = async (): Promise<boolean> => {
  try {
    const mediaLibraryGranted = await checkMediaLibraryPermissions();
    return mediaLibraryGranted;
  } catch (error) {
    console.error('Error checking upload permissions:', error);
    return false;
  }
};

