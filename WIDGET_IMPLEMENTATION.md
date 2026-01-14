# Home Screen Widget Implementation

## Summary

Native home screen widgets have been implemented for both iOS and Android to display today's habits on the device home screen.

## Files Created

### React Native / TypeScript
- `utils/widgetData.ts` - Widget data utility for writing/reading habit data
- `context/HabitsContext.tsx` - Updated to write widget data on habit changes

### iOS (WidgetKit)
- `ios/MindfulMovesWidget/HabitsWidget.swift` - Widget UI and timeline provider
- `ios/MindfulMovesWidget/HabitsWidgetBundle.swift` - Widget bundle entry point
- `ios/MindfulMoves/WidgetDataModule.swift` - Native module for App Group writes
- `ios/MindfulMoves/WidgetDataModule.m` - Objective-C bridge
- `ios/MindfulMoves/MindfulMoves.entitlements` - Updated with App Group
- `ios/MindfulMovesWidget/MindfulMovesWidget.entitlements` - Widget extension entitlements

### Android (App Widget)
- `android/app/src/main/java/com/mindfulmoves/app/HabitsWidgetProvider.kt` - Widget provider
- `android/app/src/main/res/layout/habits_widget.xml` - Widget layout
- `android/app/src/main/res/xml/habits_widget_info.xml` - Widget configuration
- `android/app/src/main/res/values/strings.xml` - Updated with widget description
- `android/app/src/main/AndroidManifest.xml` - Updated with widget registration

## Data Sharing Mechanism

### iOS: App Groups

**How it works:**
1. React Native app calls `writeWidgetData()` utility
2. Utility calls native `WidgetDataModule.writeWidgetData()`
3. Native module writes JSON data to App Group UserDefaults: `group.com.mindfulmoves.app`
4. Widget extension reads from the same App Group UserDefaults
5. Widget displays the data

**App Group Configuration:**
- Group ID: `group.com.mindfulmoves.app`
- Shared between: Main app and widget extension
- Storage: UserDefaults with suite name `group.com.mindfulmoves.app`
- Key: `widget_habits` (JSON string)

### Android: SharedPreferences

**How it works:**
1. React Native app calls `writeWidgetData()` utility
2. Utility writes to AsyncStorage (which uses SharedPreferences)
3. SharedPreferences name: `ReactNative.AsyncStorage` (default AsyncStorage name)
4. Widget reads from the same SharedPreferences
5. Widget displays the data

**SharedPreferences Configuration:**
- Name: `ReactNative.AsyncStorage` (AsyncStorage default)
- Key: `widget_habits` (JSON string)
- Access: Both app and widget can read/write

## Data Format

The widget data is stored as JSON with this structure:

```json
{
  "habits": [
    {
      "id": "habit-id",
      "name": "Habit Name",
      "completed": true
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "totalHabits": 5,
  "completedCount": 3
}
```

## Update Flow

1. **User action in app** (add/edit/toggle habit)
2. **HabitsContext updates** `habits` state
3. **useEffect triggers** when `habits` changes
4. **writeWidgetData() called** with updated habits
5. **Platform-specific write**:
   - iOS: Native module → App Group UserDefaults
   - Android: AsyncStorage → SharedPreferences
6. **Widget automatically updates**:
   - iOS: Timeline refresh (every 15 min) or when app writes
   - Android: Update period (every 15 min) or manual refresh

## Widget Features

- **Read-only display**: Shows habits, no interactions
- **Up to 5 habits**: Displays first 5 habits for today
- **Completion status**: Checkmark for completed, circle for incomplete
- **Progress indicator**: Shows "completed/total" count
- **Auto-updates**: Refreshes when habit data changes
- **Empty state**: Shows "No habits for today" when empty

## Next Steps for Full Setup

### iOS
1. Open Xcode: `ios/MindfulMoves.xcworkspace`
2. Add Widget Extension target (if not already added)
3. Configure App Groups for both app and widget extension
4. Build widget extension target
5. Run app and add widget to home screen

### Android
1. Build app: `npm run android`
2. Add widget to home screen via long-press
3. Widget should automatically appear in widget picker

## Testing Checklist

- [ ] iOS widget appears in widget picker
- [ ] iOS widget displays habits correctly
- [ ] iOS widget updates when habits change
- [ ] Android widget appears in widget picker
- [ ] Android widget displays habits correctly
- [ ] Android widget updates when habits change
- [ ] Widget handles empty state (no habits)
- [ ] Widget handles many habits (shows first 5)
- [ ] Widget updates after app is backgrounded

