//
//  WidgetShared.swift
//  MindfulMovesWidget
//
//  Shared models, data loader, and timeline provider for all widgets.
//

import WidgetKit
import SwiftUI

enum AppGroupConstants {
    static let suiteName = "group.com.mindfulmoves.app"
    static let habitsDataKey = "widget_habits"
    static let dashboardDeepLink = URL(string: "mindfulmoves://dashboard")!
    static let timelineRefreshMinutes = 15
}

struct WidgetHabit: Identifiable {
    let id: String
    let name: String
    let completed: Bool
}

struct HabitsEntry: TimelineEntry {
    let date: Date
    let habits: [WidgetHabit]
    let totalHabits: Int
    let completedCount: Int
    let currentStreak: Int
}

enum WidgetDataLoader {
    static func loadEntry() -> HabitsEntry {
        let sharedDefaults = UserDefaults(suiteName: AppGroupConstants.suiteName)

        guard let data = sharedDefaults?.data(forKey: AppGroupConstants.habitsDataKey),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let habitsArray = json["habits"] as? [[String: Any]] else {
            return HabitsEntry(
                date: Date(),
                habits: [],
                totalHabits: 0,
                completedCount: 0,
                currentStreak: 0
            )
        }

        let habits = habitsArray.compactMap { dict -> WidgetHabit? in
            guard let id = dict["id"] as? String,
                  let name = dict["name"] as? String,
                  let completed = dict["completed"] as? Bool else {
                return nil
            }
            return WidgetHabit(id: id, name: name, completed: completed)
        }

        let totalHabits = json["totalHabits"] as? Int ?? habits.count
        let completedCount = json["completedCount"] as? Int ?? habits.filter { $0.completed }.count
        let currentStreak = json["currentStreak"] as? Int ?? 0

        return HabitsEntry(
            date: Date(),
            habits: habits,
            totalHabits: totalHabits,
            completedCount: completedCount,
            currentStreak: currentStreak
        )
    }
}

struct HabitsProvider: TimelineProvider {
    func placeholder(in context: Context) -> HabitsEntry {
        HabitsEntry(
            date: Date(),
            habits: [
                WidgetHabit(id: "1", name: "Morning Meditation", completed: true),
                WidgetHabit(id: "2", name: "Exercise", completed: false),
                WidgetHabit(id: "3", name: "Read", completed: true),
            ],
            totalHabits: 3,
            completedCount: 2,
            currentStreak: 12
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HabitsEntry) -> Void) {
        completion(WidgetDataLoader.loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HabitsEntry>) -> Void) {
        let entry = WidgetDataLoader.loadEntry()
        let nextUpdate = Calendar.current.date(
            byAdding: .minute,
            value: AppGroupConstants.timelineRefreshMinutes,
            to: Date()
        )!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}
