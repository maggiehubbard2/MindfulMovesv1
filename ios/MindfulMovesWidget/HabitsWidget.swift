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
                .widgetURL(AppGroupConstants.dashboardDeepLink)
        }
        .configurationDisplayName("My Habits")
        .description("View your daily habits at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct HabitsWidgetEntryView: View {
    var entry: HabitsEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
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

            if entry.habits.isEmpty {
                Text("Same time tomorrow?")
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
        completedCount: 1,
        currentStreak: 5
    )
}
