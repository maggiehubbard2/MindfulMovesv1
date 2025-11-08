# MindfulMoves Component Tree

## Root Component Hierarchy

```
RootLayout (app/_layout.tsx)
├── ThemeProvider
│   └── AuthProvider
│       └── TasksProvider
│           └── HabitsProvider
│               └── RootLayoutNav (Stack Navigator)
│                   ├── Stack.Screen: login
│                   │   └── LoginScreen
│                   │       ├── SafeAreaView
│                   │       ├── KeyboardAvoidingView
│                   │       │   ├── View (header)
│                   │       │   │   ├── Text (title)
│                   │       │   │   └── Text (subtitle)
│                   │       │   ├── View (form)
│                   │       │   │   ├── TextInput (firstName - conditional)
│                   │       │   │   ├── TextInput (email)
│                   │       │   │   ├── TextInput (password)
│                   │       │   │   ├── TouchableOpacity (forgot password)
│                   │       │   │   ├── TouchableOpacity (auth button)
│                   │       │   │   └── TouchableOpacity (switch signup/signin)
│                   │       │   └── View (footer)
│                   │       ├── Modal (email exists modal)
│                   │       └── Modal (forgot password modal)
│                   │
│                   ├── Stack.Screen: (tabs)
│                   │   └── TabLayout (Tabs Navigator)
│                   │       ├── Tabs.Screen: index (TODO)
│                   │       │   └── TabOneScreen (index.tsx)
│                   │       │       ├── View (container)
│                   │       │       ├── SafeAreaView
│                   │       │       │   ├── StatusBar
│                   │       │       │   ├── View (pageHeader)
│                   │       │       │   │   └── Text (greeting)
│                   │       │       │   ├── Quote
│                   │       │       │   │   ├── View
│                   │       │       │   │   ├── ThemedText (quote text)
│                   │       │       │   │   └── ThemedText (author)
│                   │       │       │   ├── View (card)
│                   │       │       │   │   ├── View (cardHeader)
│                   │       │       │   │   │   └── Text (cardTitle)
│                   │       │       │   │   └── TaskList
│                   │       │       │   │       ├── GestureHandlerRootView
│                   │       │       │   │       ├── SafeAreaView
│                   │       │       │   │       │   ├── StatusBar
│                   │       │       │   │       │   └── View (container)
│                   │       │       │   │       │       └── ScrollView
│                   │       │       │   │       │           └── Swipeable (per task)
│                   │       │       │   │       │               ├── View (taskItem)
│                   │       │       │   │       │               │   ├── View (taskInfo)
│                   │       │       │   │       │               │   │   ├── Text (emoji - conditional)
│                   │       │       │   │       │               │   │   └── View (taskDetails)
│                   │       │       │   │       │               │   │       ├── Text (taskName)
│                   │       │       │   │       │               │   │       └── View (taskMeta)
│                   │       │       │   │       │               │   │           ├── Text (streak)
│                   │       │       │   │       │               │   │           └── Text (frequency)
│                   │       │       │   │       │               │   └── TouchableOpacity (checkbox)
│                   │       │       │   │       │               │       └── Ionicons (checkmark)
│                   │       │       │   │       │               └── TouchableOpacity (delete action)
│                   │       │       │   │       └── [Empty State] (if no tasks)
│                   │       │       │   └── TouchableOpacity (FAB - floating action button)
│                   │       │       │       └── Ionicons (add icon)
│                   │       │
│                   │       ├── Tabs.Screen: add (Add Task)
│                   │       │   └── AddScreen
│                   │       │       └── AddScreenContent
│                   │       │           └── View
│                   │       │               └── AddTask
│                   │       │                   ├── SafeAreaView
│                   │       │                   │   ├── StatusBar
│                   │       │                   │   └── View (content)
│                   │       │                   │       ├── View (inputContainer)
│                   │       │                   │       │   ├── TouchableOpacity (emojiButton)
│                   │       │                   │       │   │   └── ThemedText (selectedEmoji)
│                   │       │                   │       │   └── TextInput (taskName)
│                   │       │                   │       ├── TouchableOpacity (frequency selector)
│                   │       │                   │       │   ├── Ionicons
│                   │       │                   │       │   └── ThemedText
│                   │       │                   │       ├── TouchableOpacity (habit selector)
│                   │       │                   │       │   ├── Ionicons
│                   │       │                   │       │   ├── ThemedText
│                   │       │                   │       │   └── TouchableOpacity (clear habit button - conditional)
│                   │       │                   │       └── TouchableOpacity (addButton)
│                   │       │                   ├── EmojiPicker
│                   │       │                   ├── Modal (habit picker)
│                   │       │                   │   ├── View (modalOverlay)
│                   │       │                   │   └── View (modalContent)
│                   │       │                   │       ├── View (modalHeader)
│                   │       │                   │       ├── ScrollView (habitsList)
│                   │       │                   │       │   └── TouchableOpacity (per habit)
│                   │       │                   │       │       ├── Text (habitEmoji)
│                   │       │                   │       │       ├── View (habitOptionText)
│                   │       │                   │       │       └── Ionicons (checkmark)
│                   │       │                   │       └── [Empty State] (if no habits)
│                   │       │                   └── Modal (frequency picker)
│                   │       │                       └── [Similar structure to habit picker]
│                   │       │
│                   │       ├── Tabs.Screen: habits
│                   │       │   └── HabitsScreen
│                   │       │       ├── View (container)
│                   │       │       ├── SafeAreaView
│                   │       │       │   ├── StatusBar
│                   │       │       │   ├── View (header)
│                   │       │       │   │   ├── Text (greeting)
│                   │       │       │   │   └── Text (headerTitle)
│                   │       │       │   └── HabitList
│                   │       │       │       ├── GestureHandlerRootView
│                   │       │       │       ├── SafeAreaView
│                   │       │       │       │   ├── StatusBar
│                   │       │       │       │   └── View (container)
│                   │       │       │       │       └── ScrollView
│                   │       │       │       │           └── Swipeable (per habit)
│                   │       │       │       │               ├── View (habitItem)
│                   │       │       │       │               │   ├── View (habitInfo)
│                   │       │       │       │               │   │   └── View (habitDetails)
│                   │       │       │       │               │   │       ├── Text (habitName)
│                   │       │       │       │               │   │       └── Text (description - conditional)
│                   │       │       │       │               │   └── TouchableOpacity (checkbox)
│                   │       │       │       │               │       └── Ionicons (checkmark)
│                   │       │       │       │               └── TouchableOpacity (delete action)
│                   │       │       │       └── [Empty State] (if no habits)
│                   │       │       └── TouchableOpacity (FAB)
│                   │       │           └── Ionicons (add icon)
│                   │       │
│                   │       ├── Tabs.Screen: addhabit
│                   │       │   └── AddHabitScreen
│                   │       │       └── AddHabitScreenContent
│                   │       │           └── View
│                   │       │               ├── Quote
│                   │       │               │   ├── View
│                   │       │               │   ├── ThemedText (quote text)
│                   │       │               │   └── ThemedText (author)
│                   │       │               └── AddHabit
│                   │       │                   ├── SafeAreaView
│                   │       │                   │   ├── StatusBar
│                   │       │                   │   └── View (content)
│                   │       │                   │       ├── View (inputContainer)
│                   │       │                   │       │   └── TextInput (habitName)
│                   │       │                   │       ├── TextInput (description)
│                   │       │                   │       └── TouchableOpacity (addButton)
│                   │       │                   │           └── ThemedText
│                   │       │
│                   │       ├── Tabs.Screen: streak
│                   │       │   └── StreakScreen
│                   │       │       ├── View (container)
│                   │       │       ├── SafeAreaView
│                   │       │       │   ├── StatusBar
│                   │       │       │   ├── View (header)
│                   │       │       │   │   ├── Text (title)
│                   │       │       │   │   └── Text (subtitle)
│                   │       │       │   └── ScrollView
│                   │       │       │       └── MonthCalendar
│                   │       │
│                   │       ├── Tabs.Screen: settings
│                   │       │   └── SettingsScreen
│                   │       │       ├── SafeAreaView
│                   │       │       │   ├── StatusBar
│                   │       │       │   ├── View (header)
│                   │       │       │   │   └── Text (headerTitle)
│                   │       │       │   └── ScrollView
│                   │       │       │       ├── View (section - Display Settings)
│                   │       │       │       │   ├── Text (sectionTitle)
│                   │       │       │       │   ├── View (settingItem - Show Emojis)
│                   │       │       │       │   │   ├── View (settingInfo)
│                   │       │       │       │   │   │   ├── Text (settingTitle)
│                   │       │       │       │   │   │   └── Text (settingDescription)
│                   │       │       │       │   │   └── Switch
│                   │       │       │       │   ├── View (settingItem - Dark Mode)
│                   │       │       │       │   │   └── [Similar structure]
│                   │       │       │       │   └── View (settingItem - Accent Color)
│                   │       │       │       │       ├── View (settingInfo)
│                   │       │       │       │       │   ├── Ionicons
│                   │       │       │       │       │   └── Text
│                   │       │       │       │       └── View (colorOptions)
│                   │       │       │       │           └── TouchableOpacity (per color option)
│                   │       │       │       ├── View (section - Account)
│                   │       │       │       │   ├── Text (sectionTitle)
│                   │       │       │       │   ├── TouchableOpacity (edit profile)
│                   │       │       │       │   │   ├── View (settingInfo)
│                   │       │       │       │   │   │   ├── Ionicons
│                   │       │       │       │   │   │   └── View (userInfo)
│                   │       │       │       │   │   │       ├── Text
│                   │       │       │       │   │   │       └── Text (userEmail)
│                   │       │       │       │   │   └── Ionicons (chevron)
│                   │       │       │       │   └── TouchableOpacity (logoutButton)
│                   │       │       │       │       ├── Ionicons
│                   │       │       │       │       └── Text
│                   │       │       │       └── View (section - About)
│                   │       │       │           ├── Text (sectionTitle)
│                   │       │       │           └── View (settingItem)
│                   │       │       │               ├── View (settingInfo)
│                   │       │       │               │   ├── Ionicons
│                   │       │       │               │   └── Text
│                   │       │       │               └── Text (settingValue)
│                   │       │       └── Modal (logout confirmation)
│                   │       │           ├── View (modalOverlay)
│                   │       │           └── View (modalContent)
│                   │       │               ├── Ionicons
│                   │       │               ├── Text (modalTitle)
│                   │       │               ├── Text (modalMessage)
│                   │       │               └── View (modalButtonContainer)
│                   │       │                   ├── TouchableOpacity (cancel)
│                   │       │                   └── TouchableOpacity (logout)
│                   │       │
│                   │       └── TabBar Components
│                   │           ├── HapticTab
│                   │           └── TabBarBackground
│                   │
│                   └── Stack.Screen: editprofile
│                       └── [EditProfile Screen - not shown in current files]
│
└── Context Providers
    ├── ThemeProvider
    │   └── Provides: isDarkMode, toggleDarkMode, colors, accentColor, setAccentColor
    ├── AuthProvider
    │   └── Provides: user, userProfile, loading, signIn, signUp, logout, resetPassword, refreshUserProfile
    ├── TasksProvider
    │   └── Provides: tasks, showEmojis, addTask, toggleTask, removeTask, toggleEmojis, resetDailyTasks, getActiveTasksForDate
    └── HabitsProvider
        └── Provides: habits, addHabit, toggleHabit, removeHabit
```

## Component Dependencies

### Context Usage
- **ThemeProvider**: Used by all screens and most components for theming
- **AuthProvider**: Used for authentication state and user profile
- **TasksProvider**: Used by task-related screens (index, add)
- **HabitsProvider**: Used by habit-related screens (habits, addhabit)

### Navigation Structure
- **Root Stack Navigator** (`RootLayoutNav`): Handles top-level navigation
  - Login screen (unauthenticated)
  - Tabs (authenticated main app)
  - Edit Profile modal

- **Tab Navigator** (`TabLayout`): Bottom tab navigation
  - Index (TODO/Tasks)
  - Add Task
  - Habits
  - Add Habit
  - Streak
  - Settings

### Key Components
- **Quote**: Reusable component showing inspirational quotes
- **TaskList**: Displays list of tasks with swipe-to-delete
- **HabitList**: Displays list of habits with swipe-to-delete
- **AddTask**: Form for creating new tasks with emoji picker
- **AddHabit**: Form for creating new habits
- **MonthCalendar**: Calendar view for tracking streaks
- **EmojiPicker**: Modal picker for selecting emojis

### UI Utilities
- **HapticTab**: Custom tab bar button with haptic feedback
- **TabBarBackground**: Custom background for tab bar
- **ThemedText**: Text component that respects theme
- **ThemedView**: View component that respects theme

