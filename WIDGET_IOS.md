# iOS Home Screen Widget (Habits)

Read-only WidgetKit extension showing today's habits. Data is written by the main app to App Group `group.com.mindfulmoves.app` (key `widget_habits`).

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
3. Home Screen → add **Mindful Moves** / **My Habits** widget (small or medium)
4. Confirm habits list and completion icons appear
5. Complete all habits → widget shows **"Same time tomorrow?"**
6. Tap widget → app opens on dashboard (`mindfulmoves://dashboard`)

## Architecture

- `context/HabitsContext.tsx` → `writeWidgetData(habits)`
- `ios/MindfulMoves/WidgetDataModule` → App Group + `WidgetCenter.reloadTimelines`
- `ios/MindfulMovesWidget/HabitsWidget.swift` → reads JSON, 15 min timeline + reload on write

Android widget: separate future commit.
