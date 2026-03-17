# Environment Variables Setup

## 🎯 Current Issues from Terminal

```
ERROR  Error: supabaseUrl is required.
WARN   Supabase credentials not configured. Cloud sync will not work.
```

**Impact:** 
- ✅ App works fine
- ✅ Login works
- ✅ Dashboard works
- ✅ Video upload works
- ❌ Cloud sync won't work (manual and auto)

---

## ✅ Quick Fix

### Step 1: Create `.env` File

Create a file named `.env` in your project root (`Video-Watch-Timer/.env`):

```env
# Supabase Configuration (for cloud sync)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_API_KEY=your-anon-key-here

# Admin Credentials (for login)
EXPO_PUBLIC_ADMIN_ID=admin
EXPO_PUBLIC_ADMIN_PASSWORD=admin123
```

### Step 2: Get Supabase Credentials

1. Go to: https://app.supabase.com
2. Open your project
3. Go to: Settings → API
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_API_KEY`

### Step 3: Update Admin Credentials

Change the admin ID and password to whatever you want:
```env
EXPO_PUBLIC_ADMIN_ID=youradminid
EXPO_PUBLIC_ADMIN_PASSWORD=yourpassword
```

### Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)

# Restart with tunnel
npx expo start --dev-client --tunnel --clear
```

### Step 5: Rebuild APK (If needed)

Environment variables are baked into builds, so:

```bash
# For development builds to get new env vars
eas build --profile development --platform android
```

---

## ⚠️ False Warnings (Ignore These)

```
WARN  Route "./dashboard/index.tsx" is missing the required default export
WARN  Route "./database/database.tsx" is missing the required default export
WARN  Route "./userContext.tsx" is missing the required default export
WARN  Route "./video/videoDownlaoder.tsx" is missing the required default export
```

**These are false warnings!** 
- `dashboard/index.tsx` DOES have a default export
- `database.tsx`, `userContext.tsx`, `videoDownlaoder.tsx` are utility files, NOT routes
- Expo-router is being overzealous
- **Everything works fine, ignore these!**

---

## 📋 What Works Without Supabase

Without Supabase credentials, you can still:
- ✅ Login as admin
- ✅ Upload videos locally
- ✅ Watch videos
- ✅ Track analytics locally
- ✅ Export analytics as CSV
- ✅ Filter and search videos
- ✅ Everything except cloud sync!

---

## 🔐 .gitignore Check

Make sure `.env` is in your `.gitignore`:

```gitignore
# Add this if not present
.env
.env.local
.env.*.local
```

This prevents committing sensitive credentials!

---

## ✅ Verify It Works

After setting up `.env` and restarting:

**You should NOT see:**
```
ERROR  Error: supabaseUrl is required.
```

**You should see:**
```
Database schema recreated successfully!
```

And cloud sync buttons should work!

---

## 🎯 Quick Summary

**For now (app works without this):**
```bash
# App is already working!
# Login, upload videos, view analytics all work!
```

**To enable cloud sync:**
1. Create `.env` file
2. Add Supabase credentials
3. Restart server: `npx expo start --dev-client --tunnel --clear`
4. Rebuild APK (for permanent fix)

**Priority:** Low - Only needed if you want to sync data to cloud!

---

## 💡 Development vs Production

### During Development:
- `.env` file is read automatically
- Restart server to pick up changes

### For APK Builds:
- Environment variables are baked into the build
- Need to rebuild after changing `.env`

---

**Your app is working! Cloud sync is optional.** 🚀

