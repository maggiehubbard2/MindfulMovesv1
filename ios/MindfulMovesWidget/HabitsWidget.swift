//
//  HabitsWidget.swift
//  MindfulMovesWidget
//
//  iOS WidgetKit extension for displaying habits on home screen
//

import WidgetKit
import SwiftUI

struct HabitsWidget: Widget {
    let kind: String = "HabitsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitsProvider()) { entry in
            HabitsWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("My Habits")
        .description("View your daily habits at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
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
            completedCount: 2
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HabitsEntry) -> ()) {
        let entry = loadHabitsEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HabitsEntry>) -> ()) {
        let entry = loadHabitsEntry()
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadHabitsEntry() -> HabitsEntry {
        // Read from App Group UserDefaults (shared with main app)
        let sharedDefaults = UserDefaults(suiteName: "group.com.mindfulmoves.app")
        
        guard let data = sharedDefaults?.data(forKey: "widget_habits"),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let habitsArray = json["habits"] as? [[String: Any]] else {
            return HabitsEntry(
                date: Date(),
                habits: [],
                totalHabits: 0,
                completedCount: 0
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
        
        return HabitsEntry(
            date: Date(),
            habits: habits,
            totalHabits: totalHabits,
            completedCount: completedCount
        )
    }
}

struct HabitsEntry: TimelineEntry {
    let date: Date
    let habits: [WidgetHabit]
    let totalHabits: Int
    let completedCount: Int
}

struct WidgetHabit: Identifiable {
    let id: String
    let name: String
    let completed: Bool
}

struct HabitsWidgetEntryView: View {
    var entry: HabitsProvider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text("Today's Habits")
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
                if entry.totalHabits > 0 {
                    Text("\(entry.completedCount)/\(entry.totalHabits)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Habits list
            if entry.habits.isEmpty {
                Text("No habits for today")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(Array(entry.habits.prefix(5))) { habit in
                        HStack(spacing: 8) {
                            Image(systemName: habit.completed ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(habit.completed ? .green : .gray)
                                .font(.system(size: 14))
                            Text(habit.name)
                                .font(.caption)
                                .foregroundColor(.primary)
                                .lineLimit(1)
                            Spacer()
                        }
                    }
                }
            }
        }
        .padding()
    }
}

#Preview(as: .systemSmall) {
    HabitsWidget()
} timeline: {
    HabitsEntry(
        date: Date(),
        habits: [
            WidgetHabit(id: "1", name: "Morning Meditation", completed: true),
            WidgetHabit(id: "2", name: "Exercise", completed: false),
        ],
        totalHabits: 2,
        completedCount: 1
    )
}

