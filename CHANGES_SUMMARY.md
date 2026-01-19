# Cold Start Debugging Changes Summary

## Changes Made

### 1. **Splash Screen Management** (`app/_layout.tsx`)
   - ✅ Added `SplashScreen.preventAutoHideAsync()` at module level (prevents auto-hide)
   - ✅ Added `SplashScreen.hideAsync()` when auth loading completes
   - ✅ Added 5-second timeout fallback to hide splash even if auth hangs
   - **Impact**: Fixes the most likely cause - splash screen staying visible indefinitely

### 2. **AuthContext Timeout Protection** (`context/AuthContext.tsx`)
   - ✅ Added 5-second timeout wrapper around `supabase.auth.getSession()`
   - ✅ Falls back to no session if timeout occurs
   - ✅ Prevents infinite hang if `getSession()` blocks
   - **Impact**: Prevents app from hanging indefinitely on slow AsyncStorage/Supabase calls

### 3. **Diagnostic Logging** (Multiple files)
   Added `[COLD_START]` prefixed logs at key checkpoints:
   - ✅ `app/_layout.tsx` - RootLayout mount/unmount, splash screen operations
   - ✅ `context/AuthContext.tsx` - Auth initialization, session retrieval timing
   - ✅ `context/ThemeContext.tsx` - AsyncStorage read timing
   - ✅ `app/index.tsx` - Route mounting and navigation decisions
   - ✅ `config/supabase.ts` - Client initialization timing
   - **Impact**: Provides visibility into where the app hangs during cold start

## How to Use

1. **Build a production-like build:**
   ```bash
   npx expo prebuild --platform ios
   npx expo run:ios --configuration Release
   ```

2. **View logs:**
   - Xcode Console (filter for `[COLD_START]`)
   - Terminal: `xcrun simctl spawn booted log stream --predicate 'eventMessage contains "[COLD_START]"'`
   - React Native Debugger console

3. **Reproduce cold start:**
   - Force quit app
   - Wait 30+ seconds
   - Launch from home screen
   - Watch logs immediately

4. **Identify hang point:**
   - Check the last `[COLD_START]` log message
   - That's where the app is getting stuck

## Expected Behavior

### Before Fix:
- App stuck on white/splash screen indefinitely on cold start
- No visibility into what's blocking

### After Fix:
- Splash screen hides within 5 seconds maximum (timeout protection)
- Auth initialization has timeout protection (won't hang forever)
- Logs show exactly where any delays occur
- App should load successfully even with slow network/storage

## Next Steps

1. **Test the changes** with a production build
2. **Check logs** to identify if splash screen was the issue
3. **If still hanging**, logs will show the exact checkpoint where it stops
4. **After confirming fix**, optionally remove diagnostic logging (or keep for future debugging)

## Safety Notes

- ✅ All changes are backward compatible
- ✅ Timeout protections prevent hangs but don't change core behavior
- ✅ Diagnostic logging can be removed without impact
- ✅ Splash screen management follows Expo best practices
- ✅ No new dependencies added
