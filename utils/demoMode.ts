/**
 * Screenshot demo mode.
 *
 * On (dev builds only):
 *   EXPO_PUBLIC_DEMO_MODE=1 npx expo start
 * or: npm run start:demo
 *
 * Restart Metro after changing the flag. Release builds ignore it.
 * Habits, the display name, and theme tweaks stay in memory and are not written
 * to Supabase or AsyncStorage.
 */

export const DEMO_FIRST_NAME = 'Maya';

type PreviewListener = () => void;

let streakPreviewRequested = false;
const streakPreviewListeners = new Set<PreviewListener>();

export function isDemoMode(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_DEMO_MODE === '1';
}

/** Ask the dashboard to open the streak share card. Does not depend on checking every habit. */
export function requestStreakPreview(): void {
  streakPreviewRequested = true;
  streakPreviewListeners.forEach((listener) => listener());
}

export function consumeStreakPreview(): boolean {
  if (!streakPreviewRequested) return false;
  streakPreviewRequested = false;
  return true;
}

export function subscribeStreakPreview(listener: PreviewListener): () => void {
  streakPreviewListeners.add(listener);
  return () => {
    streakPreviewListeners.delete(listener);
  };
}
