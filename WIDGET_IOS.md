# iOS Widgets (Habits + Streak)

WidgetKit extension with Home Screen and Lock Screen widgets. Data is written by the main app to App Group `group.com.mindfulmoves.app` (key `widget_habits`).

## Widgets

| Widget | Families | Display name |
|--------|----------|--------------|
| Habits | Small, Medium (Home Screen) | My Habits |
| Streak | Circular, Inline (Lock Screen) | Streak |

## Manual setup (Apple Developer + Xcode)

1. **App Groups** — Enable on both identifiers:
   - `com.mindfulmoves.app` (main app)
   - `com.mindfulmoves.app.MindfulMovesWidget` (widget extension)
   - Group: `group.com.mindfulmoves.app`

2. **Xcode** — Open `ios/MindfulMoves.xcworkspace`:
   - Confirm **MindfulMovesWidgetExtension** target exists
   - Main app → Build Phases → **Embed Foundation Extensions** includes the `.appex`
   - Both targets use the same **Development Team**

3. **Do not run** `npx expo prebuild -p ios --clean` without re-applying widget native files (prebuild can remove the extension).

## Test checklist

1. `npx expo run:ios` (or Xcode → Run on device/simulator)
2. Log in and ensure habits exist for today (or none for empty state)
3. **Home Screen** → add **Mindful Moves** / **My Habits** widget (small or medium)
4. Confirm habits list and completion icons appear
5. Complete all habits → widget shows **"Same time tomorrow?"**
6. **Lock Screen** → customize → add **Streak** circular or inline widget
7. Confirm flame + streak number on circular widget
8. Tap either widget → app opens on dashboard (`mindfulmoves://dashboard`)

## Architecture

- `utils/streak.ts` → shared `calculateCurrentStreak` (app + widget data)
- `context/HabitsContext.tsx` → `writeWidgetData(habits)`
- `utils/widgetData.ts` → JSON payload including `currentStreak`
- `ios/MindfulMoves/WidgetDataModule` → App Group + `WidgetCenter.reloadAllTimelines`
- `ios/MindfulMovesWidget/WidgetShared.swift` → shared loader + `HabitsProvider`
- `ios/MindfulMovesWidget/HabitsWidget.swift` → Home Screen UI
- `ios/MindfulMovesWidget/StreakWidget.swift` → Lock Screen UI

Android widget: separate future commit.
