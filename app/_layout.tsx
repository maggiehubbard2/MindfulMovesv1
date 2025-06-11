import { HabitsProvider } from '@/context/HabitsContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <HabitsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </HabitsProvider>
    </ThemeProvider>
  );
}
