# Home Screen Widget Setup Guide

This guide explains how to set up and configure the native home screen widgets for iOS and Android.

## Overview

The app includes native widgets that display today's habits on the device home screen:
- **iOS**: WidgetKit extension
- **Android**: App Widget

## Data Sharing Mechanism

### iOS (App Groups)
- The React Native app writes habit data to **App Group UserDefaults** (`group.com.mindfulmoves.app`)
- The widget extension reads from the same App Group
- Native module `WidgetDataModule` handles the write operation

### Android (SharedPreferences)
- The React Native app writes habit data to **SharedPreferences** via AsyncStorage
- The widget reads from the same SharedPreferences (`ReactNative.AsyncStorage`)
- Widget key: `widget_habits`

## iOS Setup

### 1. Configure App Group

1. Open Xcode project: `ios/MindfulMoves.xcworkspace`
2. Select the main app target (`MindfulMoves`)
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **App Groups**
6. Create/select group: `group.com.mindfulmoves.app`
7. Repeat for the widget extension target (`MindfulMovesWidget`)

### 2. Add Widget Extension to Xcode Project

1. In Xcode, go to **File → New → Target**
2. Select **Widget Extension**
3. Name it: `MindfulMovesWidget`
4. Product Name: `MindfulMovesWidget`
5. Include Configuration Intent: **No** (we're using StaticConfiguration)
6. Add the widget files:
   - `HabitsWidget.swift`
   - `HabitsWidgetBundle.swift`

### 3. Configure Widget Extension

1. Select the widget extension target
2. Set **Deployment Target** to iOS 14.0+ (WidgetKit requirement)
3. Add App Group capability (same group as main app)
4. Ensure widget extension is included in the app scheme

### 4. Update Info.plist (if needed)

The widget extension should have its own Info.plist. Ensure it includes:
- Widget configuration display name
- Supported widget families

## Android Setup

### 1. Widget Files Created

The following files have been created:
- `HabitsWidgetProvider.kt` - Widget provider class
- `habits_widget.xml` - Widget layout
- `habits_widget_info.xml` - Widget configuration
- `AndroidManifest.xml` - Widget registration (already updated)

### 2. Build and Test

1. Build the Android app: `npm run android`
2. Long-press on home screen
3. Select **Widgets**
4. Find **MindfulMoves Habits Widget**
5. Add to home screen

## How It Works

### Data Flow

```
React Native App (HabitsContext)
    ↓
writeWidgetData() utility
    ↓
Platform-specific storage:
  - iOS: App Group UserDefaults (via WidgetDataModule)
  - Android: SharedPreferences (via AsyncStorage)
    ↓
Native Widget Extension
    ↓
Home Screen Widget Display
```

### Update Mechanism

1. **Automatic Updates**: Widgets update automatically when habit data changes in the app
2. **Timeline Refresh**: 
   - iOS: Updates every 15 minutes (WidgetKit timeline)
   - Android: Updates every 15 minutes (updatePeriodMillis)
3. **Manual Refresh**: Users can force refresh by removing and re-adding the widget

### Widget Display

- Shows up to 5 habits
- Displays completion status (checkmark/circle)
- Shows progress (completed/total)
- Read-only (no interactions)

## Testing

### iOS
1. Build and run the app
2. Add some habits
3. Build the widget extension target
4. Long-press on iOS home screen
5. Tap **+** to add widgets
6. Search for "MindfulMoves" or "Habits"
7. Add widget to home screen
8. Verify habits appear correctly

### Android
1. Build and run the app: `npm run android`
2. Add some habits
3. Long-press on home screen
4. Select **Widgets**
5. Find **MindfulMoves Habits Widget**
6. Add to home screen
7. Verify habits appear correctly

## Troubleshooting

### iOS Widget Not Showing Data

1. **Check App Group**: Ensure both app and widget extension have the same App Group configured
2. **Check Native Module**: Verify `WidgetDataModule` is properly linked
3. **Check Data Format**: Verify JSON structure matches what widget expects
4. **Check Permissions**: Ensure widget extension has proper entitlements

### Android Widget Not Showing Data

1. **Check SharedPreferences**: Verify data is being written with key `widget_habits`
2. **Check Widget Registration**: Verify widget is registered in AndroidManifest.xml
3. **Check Layout**: Verify `habits_widget.xml` exists and is valid
4. **Check Logs**: Check Logcat for widget update errors

### Widget Not Updating

1. **Force Refresh**: Remove and re-add the widget
2. **Check Timeline**: iOS widgets update on timeline schedule (15 min)
3. **Check Update Period**: Android widgets update based on `updatePeriodMillis`
4. **Verify Data Writing**: Check that `writeWidgetData` is being called when habits change

## Next Steps (Optional Enhancements)

- Add widget configuration screen
- Support multiple widget sizes
- Add tap-to-open app functionality
- Add widget refresh button
- Support dark mode theming

