package com.mindfulmoves.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

/**
 * Android App Widget for displaying habits on home screen
 * 
 * Reads habit data from SharedPreferences (shared with React Native app)
 * Updates widget display with today's habits
 */
class HabitsWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Widget enabled
    }

    override fun onDisabled(context: Context) {
        // Widget disabled
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.habits_widget)
        
        // Read widget data from SharedPreferences
        val prefs: SharedPreferences = context.getSharedPreferences(
            "ReactNative.AsyncStorage",
            Context.MODE_PRIVATE
        )
        
        val widgetDataJson = prefs.getString("widget_habits", null)
        
        if (widgetDataJson != null) {
            try {
                val json = JSONObject(widgetDataJson)
                val habitsArray = json.getJSONArray("habits")
                val totalHabits = json.optInt("totalHabits", habitsArray.length())
                val completedCount = json.optInt("completedCount", 0)
                
                // Update header
                views.setTextViewText(R.id.widget_title, "Today's Habits")
                views.setTextViewText(R.id.widget_progress, "$completedCount/$totalHabits")
                
                // Update habits list (show up to 5 habits)
                val maxHabits = minOf(5, habitsArray.length())
                for (i in 0 until maxHabits) {
                    val habit = habitsArray.getJSONObject(i)
                    val habitName = habit.getString("name")
                    val completed = habit.getBoolean("completed")
                    
                    // Set habit name and checkmark
                    val habitViewId = when (i) {
                        0 -> R.id.habit_1
                        1 -> R.id.habit_2
                        2 -> R.id.habit_3
                        3 -> R.id.habit_4
                        4 -> R.id.habit_5
                        else -> null
                    }
                    
                    habitViewId?.let { viewId ->
                        views.setTextViewText(viewId, habitName)
                        val checkmarkId = when (i) {
                            0 -> R.id.check_1
                            1 -> R.id.check_2
                            2 -> R.id.check_3
                            3 -> R.id.check_4
                            4 -> R.id.check_5
                            else -> null
                        }
                        checkmarkId?.let { checkId ->
                            views.setImageViewResource(
                                checkId,
                                if (completed) android.R.drawable.checkbox_on_background
                                else android.R.drawable.checkbox_off_background
                            )
                        }
                    }
                }
                
                // Hide unused habit views
                for (i in maxHabits until 5) {
                    val habitViewId = when (i) {
                        0 -> R.id.habit_1
                        1 -> R.id.habit_2
                        2 -> R.id.habit_3
                        3 -> R.id.habit_4
                        4 -> R.id.habit_5
                        else -> null
                    }
                    habitViewId?.let { views.setViewVisibility(it, android.view.View.GONE) }
                }
                
            } catch (e: Exception) {
                // Error parsing data - show empty state
                views.setTextViewText(R.id.widget_title, "Today's Habits")
                views.setTextViewText(R.id.widget_progress, "0/0")
            }
        } else {
            // No data - show empty state
            views.setTextViewText(R.id.widget_title, "Today's Habits")
            views.setTextViewText(R.id.widget_progress, "0/0")
        }
        
        // Update widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}

