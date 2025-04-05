import * as FileSystem from 'expo-file-system';

// Directory where videos will be stored
const VIDEO_DIR = FileSystem.documentDirectory + 'videos/';

export const downloadVideo = async (videoId: string, videoUrl: string) => {
  try {
    // Ensure the directory exists
    const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VIDEO_DIR, { intermediates: true });
    }

    const fileUri = VIDEO_DIR + videoId + '.mp4';
    const fileExists = await FileSystem.getInfoAsync(fileUri);

    if (!fileExists.exists) {
      console.log(`Downloading ${videoId}...`);
      await FileSystem.downloadAsync(videoUrl, fileUri);
      console.log(`Downloaded ${videoId} to ${fileUri}`);
    } else {
      console.log(`${videoId} already exists locally.`);
    }

    return fileUri;
  } catch (error) {
    console.error('Error downloading video:', error);
    return null;
  }
};

// Get local video URI
// Get local video URI - async version
export const getVideoUri = async (videoId: string): Promise<string | null> => {
    try {
      const fileUri = VIDEO_DIR + videoId + '.mp4';
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      return fileInfo.exists ? fileUri : null;
    } catch (error) {
      console.error('Error checking video file:', error);
      return null;
    }
  };

  export const clearDownloadedVideos = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(VIDEO_DIR, { idempotent: true });
        console.log('All downloaded videos cleared.');
      } else {
        console.log('No videos to clear.');
      }
    } catch (error) {
      console.error('Error clearing videos:', error);
    }
  };