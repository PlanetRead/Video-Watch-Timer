// migrateDbIfNeeded.ts
import { SQLiteDatabase } from 'expo-sqlite';


export const initializeDatabase = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY NOT NULL, 
          user_name TEXT NOT NULL, 
          pin INTEGER
        );
  
        -- Recreate the video analytics table
        CREATE TABLE IF NOT EXISTS video_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          user_id TEXT NOT NULL, 
          video_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          total_views_day INTEGER DEFAULT 0,
          total_time_day INTEGER DEFAULT 0,
          last_time_stamp INTEGER,
          language TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES user(id)
        );
  
        -- Ensure each user can have only one record per video per language per day
        CREATE UNIQUE INDEX IF NOT EXISTS unique_video_language 
        ON video_analytics (user_id, video_id, language, date);

        -- Create videos table for uploaded videos
        CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          thumbnail_uri TEXT,
          video_uri TEXT NOT NULL,
          language TEXT NOT NULL,
          level TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS video_watch_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          video_id INTEGER NOT NULL,
          language TEXT NOT NULL,
          watch_time INTEGER NOT NULL,
          video_duration INTEGER DEFAULT 0,
          completed INTEGER DEFAULT 0,
          watched_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY(user_id) REFERENCES user(id)
        );

        CREATE INDEX IF NOT EXISTS idx_watch_sessions_user ON video_watch_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_watch_sessions_video ON video_watch_sessions(video_id);
        CREATE INDEX IF NOT EXISTS idx_watch_sessions_watched_at ON video_watch_sessions(watched_at);
      `);
  
      console.log('Database schema recreated successfully!');
    } catch (error) {
      console.error('Error during database initialization:', error);
    }
  };
  


  export const getUsers = async (db: SQLiteDatabase): Promise<{ id: string; user_name: string; pin: number }[]> => {
    try {
      const result = await db.getAllAsync("SELECT * FROM user");
      return result as { id: string; user_name: string; pin: number }[]; // Explicit cast
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };
  

  export const createUser = async (db: SQLiteDatabase, id: string, user_name: string, pin: number) => {
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO user (id, user_name, pin) VALUES (?, ?, ?)',
        [id, user_name, pin]
      );
      console.log(`User with ${id} created successfully!`);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };
  
  
  /** 
   * Get video analytics for a specific user 
   */
  export const getVideoAnalyticsByUser = async (db: SQLiteDatabase, userId: string) => {
    try {
      const analytics = await db.getAllAsync<{
        id: number;
        name: string;
        video_id: number;
        date: string;
        total_views_day: number;
        total_time_day: number;
        last_time_stamp: number | null;
        language: string;
      }>('SELECT * FROM video_analytics WHERE user_id = ?', userId);
  
      return analytics;
    } catch (error) {
      console.error('Error fetching video analytics:', error);
      return [];
    }
  };
  
  /** 
   * Delete a user by ID 
   */
  export const deleteUser = async (db: SQLiteDatabase, userId: string) => {
    try {
      await db.runAsync('DELETE FROM user WHERE id = ?', userId);
      console.log(`User with ID ${userId} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };
  
  /** 
   * Delete video analytics by ID 
   */
  export const deleteVideoAnalytics = async (db: SQLiteDatabase, analyticsId: number) => {
    try {
      await db.runAsync('DELETE FROM video_analytics WHERE id = ?', analyticsId);
      console.log(`Video analytics record with ID ${analyticsId} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting video analytics:', error);
    }
  };

 export  const checkSchema = async (db:SQLiteDatabase) => {
    try {
      const result = await db.getAllAsync("PRAGMA table_info(user);");
      console.log("User Table Schema:", result);
    } catch (error) {
      console.error("Error checking schema:", error);
    }
  };

  export const createVideoAnalytics = async (
    db: SQLiteDatabase,
    userId: string,
    videoId: number,
    date: string,
    language: string
  ) => {
    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO video_analytics 
         (user_id, video_id, date, total_views_day, total_time_day, last_time_stamp, language) 
         VALUES (?, ?, ?, 1, 0, 0, ?)`,
        [userId, videoId, date, language]
      );
  
      console.log(`Analytics recorded for Video ${videoId} (${language})`);
    } catch (error) {
      console.error("Error inserting video analytics:", error);
    }
  };
  
// delete all the data regarding the user but here we will have one user only so we will delete all the data noo need of id
export const deleteAllUserData = async (db: SQLiteDatabase) => {
    try {
      // await db.runAsync('DELETE FROM user');
      await db.runAsync('DELETE FROM video_analytics');
      await db.runAsync('DELETE FROM video_watch_sessions');
      console.log('All user data deleted successfully!');
    } catch (error) {
      console.error('Error deleting all user data:', error);
    }
  }


  //edit username with user id
export const editUserName = async (db: SQLiteDatabase, userId: string, newUserName: string) => {
    try {
      await db.runAsync('UPDATE user SET user_name = ? WHERE id = ?', [newUserName, userId]);
      console.log(`User name updated to ${newUserName} for user ID ${userId}`);
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  }

  // Video management functions
  export interface Video {
    id: number;
    title: string;
    description?: string;
    thumbnail_uri?: string;
    video_uri: string;
    language: string;
    level: string;
    created_at: string;
  }

  export const getAllVideos = async (db: SQLiteDatabase): Promise<Video[]> => {
    try {
      const videos = await db.getAllAsync<Video>('SELECT * FROM videos ORDER BY created_at DESC');
      return videos;
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
  };

  export const createVideo = async (
    db: SQLiteDatabase,
    title: string,
    description: string,
    thumbnail_uri: string,
    video_uri: string,
    language: string,
    level: string
  ): Promise<number | null> => {
    try {
      const result = await db.runAsync(
        'INSERT INTO videos (title, description, thumbnail_uri, video_uri, language, level) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, thumbnail_uri, video_uri, language, level]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating video:', error);
      return null;
    }
  };

  export const deleteVideo = async (db: SQLiteDatabase, videoId: number): Promise<boolean> => {
    try {
      await db.runAsync('DELETE FROM videos WHERE id = ?', [videoId]);
      console.log(`Video with ID ${videoId} deleted successfully!`);
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  };

  export interface VideoWatchSession {
    id: number;
    user_id: string;
    video_id: number;
    language: string;
    watch_time: number;
    video_duration: number;
    completed: number;
    watched_at: string;
  }

  export const recordWatchSession = async (
    db: SQLiteDatabase,
    {
      userId,
      videoId,
      language,
      watchTime,
      videoDuration,
      completed,
      watchedAt,
    }: {
      userId: string;
      videoId: number;
      language: string;
      watchTime: number;
      videoDuration: number;
      completed: boolean;
      watchedAt: string;
    }
  ): Promise<void> => {
    try {
      await db.runAsync(
        `INSERT INTO video_watch_sessions 
          (user_id, video_id, language, watch_time, video_duration, completed, watched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          videoId,
          language,
          watchTime,
          videoDuration,
          completed ? 1 : 0,
          watchedAt,
        ]
      );
    } catch (error) {
      console.error('Error recording watch session:', error);
    }
  };

  export const getVideoWatchSessionsByUser = async (
    db: SQLiteDatabase,
    userId: string
  ): Promise<VideoWatchSession[]> => {
    try {
      const sessions = await db.getAllAsync<VideoWatchSession>(
        `SELECT * FROM video_watch_sessions 
         WHERE user_id = ?
         ORDER BY datetime(watched_at) DESC`,
        [userId]
      );

      return sessions;
    } catch (error) {
      console.error('Error fetching watch sessions:', error);
      return [];
    }
  };

  export const getVideoById = async (db: SQLiteDatabase, videoId: number): Promise<Video | null> => {
    try {
      const videos = await db.getAllAsync<Video>('SELECT * FROM videos WHERE id = ?', [videoId]);
      return videos.length > 0 ? videos[0] : null;
    } catch (error) {
      console.error('Error fetching video:', error);
      return null;
    }
  };