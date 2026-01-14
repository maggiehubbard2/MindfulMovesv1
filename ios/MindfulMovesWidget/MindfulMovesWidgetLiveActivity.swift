//
//  MindfulMovesWidgetLiveActivity.swift
//  MindfulMovesWidget
//
//  Created by Maggie on 1/13/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct MindfulMovesWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct MindfulMovesWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MindfulMovesWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension MindfulMovesWidgetAttributes {
    fileprivate static var preview: MindfulMovesWidgetAttributes {
        MindfulMovesWidgetAttributes(name: "World")
    }
}

extension MindfulMovesWidgetAttributes.ContentState {
    fileprivate static var smiley: MindfulMovesWidgetAttributes.ContentState {
        MindfulMovesWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: MindfulMovesWidgetAttributes.ContentState {
         MindfulMovesWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: MindfulMovesWidgetAttributes.preview) {
   MindfulMovesWidgetLiveActivity()
} contentStates: {
    MindfulMovesWidgetAttributes.ContentState.smiley
    MindfulMovesWidgetAttributes.ContentState.starEyes
}
