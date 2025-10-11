import '@/config/firebase'; // Initialize Firebase
import { HabitsProvider } from '@/context/HabitsContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

function RootLayoutNav() {
  const { colors } = useTheme();
  
  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="(tabs)/add" 
        options={{ 
          headerShown: true,
          headerTitle: 'Add New Habit',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.primary,
          headerShadowVisible: true,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HabitsProvider>
          <RootLayoutNav />
        </HabitsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
