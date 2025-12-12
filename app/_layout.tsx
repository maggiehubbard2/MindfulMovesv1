import '@/config/firebase'; // Initialize Firebase
import { AuthProvider } from '@/context/AuthContext';
import { HabitsProvider } from '@/context/HabitsContext';
import { TasksProvider } from '@/context/TasksContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

function RootLayoutNav() {
  const { colors } = useTheme();
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="addhabit"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="editprofile" 
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TasksProvider>
          <HabitsProvider>
            <RootLayoutNav />
          </HabitsProvider>
        </TasksProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
