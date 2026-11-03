//
//  StreakWidget.swift
//  MindfulMovesWidget
//
//  Lock Screen widget showing the user's current habit streak.
//

import WidgetKit
import SwiftUI

struct StreakWidget: Widget {
    let kind: String = "StreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitsProvider()) { entry in
            StreakWidgetEntryView(entry: entry)
                .widgetURL(AppGroupConstants.dashboardDeepLink)
        }
        .configurationDisplayName("Streak")
        .description("Your current habit streak.")
        .supportedFamilies([.accessoryCircular, .accessoryInline])
    }
}

struct StreakWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    var entry: HabitsEntry

    var body: some View {
        switch family {
        case .accessoryCircular:
            StreakCircularView(streak: entry.currentStreak)
        case .accessoryInline:
            StreakInlineView(streak: entry.currentStreak)
        default:
            StreakCircularView(streak: entry.currentStreak)
        }
    }
}

struct StreakCircularView: View {
    let streak: Int

    private var numberFontSize: CGFloat {
        switch streak {
        case 0...9: return 20
        case 10...99: return 17
        default: return 14
        }
    }

    var body: some View {
        ZStack {
            Image(systemName: "flame.fill")
                .font(.system(size: 34, weight: .bold))
                .symbolRenderingMode(.hierarchical)
                .foregroundStyle(.orange)
                .widgetAccentable()

            Text("\(streak)")
                .font(.system(size: numberFontSize, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
                .offset(y: 1)
        }
    }
}

struct StreakInlineView: View {
    let streak: Int

    private var streakLabel: String {
        streak == 1 ? "1 Day Streak" : "\(streak) Day Streak"
    }

    var body: some View {
        Label {
            Text(streakLabel)
        } icon: {
            Image(systemName: "flame.fill")
        }
        .widgetAccentable()
    }
}

#Preview(as: .accessoryCircular) {
    StreakWidget()
} timeline: {
    HabitsEntry(
        date: Date(),
        habits: [],
        totalHabits: 0,
        completedCount: 0,
        currentStreak: 12
    )
}

#Preview(as: .accessoryInline) {
    StreakWidget()
} timeline: {
    HabitsEntry(
        date: Date(),
        habits: [],
        totalHabits: 0,
        completedCount: 0,
        currentStreak: 12
    )
}
