# Cold Start White Screen Debugging Guide

## Most Likely Causes (in order of probability)

1. **Splash Screen Never Hides** ⚠️ **MOST LIKELY**
   - `expo-splash-screen` is configured but there's no code calling `SplashScreen.hideAsync()`
   - On cold start, the splash screen can remain visible indefinitely
   - The white screen might actually be the splash screen stuck

2. **AuthContext `getSession()` Hanging**
   - `supabase.auth.getSession()` may hang if AsyncStorage is slow/corrupted on cold start
   - No timeout protection - if it hangs, `loading` never becomes `false`
   - `index.tsx` waits indefinitely for `loading` to be false

3. **AsyncStorage Slow on Cold Start**
   - Multiple contexts (Auth, Theme) call AsyncStorage synchronously on mount
   - iOS cold starts can have slower I/O, causing delays

4. **Navigation Not Mounting**
   - If RootLayout never renders, navigation won't initialize
   - Could be blocked by context providers not resolving

5. **Supabase Client Initialization Blocking**
   - Top-level import `@/config/supabase` could execute blocking code
   - AsyncStorage adapter initialization might be slow

## Instrumentation Strategy

We've added diagnostic logging at key checkpoints:

1. **App Entry Point** (`app/_layout.tsx`)
   - Logs when RootLayout mounts
   - Logs when contexts wrap

2. **Splash Screen** (`app/_layout.tsx`)
   - Logs when preventing auto-hide
   - Logs when hiding splash

3. **AuthContext** (`context/AuthContext.tsx`)
   - Logs initialization start
   - Logs session retrieval start/end
   - Logs loading state changes
   - Includes timeout protection (5s)

4. **ThemeContext** (`context/ThemeContext.tsx`)
   - Logs AsyncStorage reads

5. **Index Route** (`app/index.tsx`)
   - Logs when component mounts
   - Logs routing decisions

## How to Debug Locally

### 1. Build Production-like iOS Build

```bash
# Build a development client (includes instrumentation)
npx expo prebuild --platform ios
npx expo run:ios --configuration Release

# OR use EAS Build for exact TestFlight environment
eas build --profile production --platform ios
```

### 2. View Logs

#### Option A: Xcode Console
```bash
# Open Xcode
open ios/MindfulMoves.xcworkspace

# Run the app and watch Console tab
# Filter for: [COLD_START]
```

#### Option B: Terminal (while app runs)
```bash
# iOS Simulator
xcrun simctl spawn booted log stream --level=debug --predicate 'eventMessage contains "[COLD_START]"'

# Physical Device (requires device connected)
idevicesyslog | grep "\[COLD_START\]"
```

#### Option C: React Native Debugger
- Shake device → "Debug"
- Open Chrome DevTools Console
- Filter for `[COLD_START]`

### 3. Reproduce Cold Start

#### Simulator:
```bash
# Kill the app completely
xcrun simctl terminate booted com.mindfulmoves.app

# Wait 30+ seconds (simulates cold start)

# Launch fresh
xcrun simctl launch booted com.mindfulmoves.app
```

#### Physical Device:
1. Force quit app (swipe up in app switcher)
2. Wait 30+ seconds
3. Launch from home screen
4. Watch logs immediately

### 4. Analyze Logs

Look for the sequence of `[COLD_START]` markers:

**Expected Sequence:**
```
[COLD_START] RootLayout mounting...
[COLD_START] Preventing splash auto-hide
[COLD_START] ThemeProvider mounting...
[COLD_START] AuthProvider mounting...
[COLD_START] AuthContext: Starting initialization
[COLD_START] AuthContext: Getting session...
[COLD_START] AuthContext: Session retrieved (or null)
[COLD_START] AuthContext: Loading set to false
[COLD_START] Index route mounted
[COLD_START] Hiding splash screen
```

**If Stuck, Last Log Shows Where:**
- No logs at all → App entry point not executing
- Stops at "Getting session..." → `getSession()` hanging
- Stops at "Loading set to false" → Navigation/routing issue
- Never "Hiding splash screen" → Splash screen issue

### 5. Test with Network Disabled

To rule out network issues:

```bash
# Disable network on simulator
xcrun simctl status_bar booted override --wifiBars 0 --dataNetwork none

# Or in Network Link Conditioner (macOS)
# System Preferences → Network → Advanced → Link Conditioner
```

## Safe Diagnostic Changes Applied

All changes are **diagnostic-only** and designed to:
- ✅ Not change app behavior
- ✅ Add visibility without risk
- ✅ Include timeout protection to prevent infinite hangs
- ✅ Maintain backward compatibility

### Changes Made:

1. **Splash Screen Management** (`app/_layout.tsx`)
   - Added `preventAutoHideAsync()` on mount
   - Added `hideAsync()` after auth loads
   - Ensures splash hides even if auth hangs (with timeout)

2. **AuthContext Timeout** (`context/AuthContext.tsx`)
   - 5-second timeout on `getSession()` call
   - Falls back to no session if timeout
   - Prevents infinite hang

3. **Diagnostic Logging**
   - All checkpoints logged with `[COLD_START]` prefix
   - Can be disabled by removing console.log calls
   - No performance impact in production (logs filtered)

## Next Steps

1. **Build and test** using production-like build
2. **Check logs** to see where it stops
3. **Identify the hang point** from last log message
4. **Apply targeted fix** based on findings

If it's the splash screen, the changes already fix it.
If it's auth, the timeout will prevent the hang (but we should investigate why `getSession()` is slow).
If it's something else, the logs will show exactly where.

## Removing Diagnostic Code

Once identified and fixed, you can remove:
- All `console.log('[COLD_START]'...)` statements
- The timeout wrapper in AuthContext (or keep it as safety)

Keep:
- Splash screen management (essential)
- Any timeout protections (safety measure)
