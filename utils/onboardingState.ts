import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onboardingStorageKey,
  parseOnboardingRecord,
  type OnboardingRecord,
} from '@/utils/onboardingClassification';

export async function readOnboardingRecord(userId: string): Promise<OnboardingRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(onboardingStorageKey(userId));
    if (!raw) return null;
    return parseOnboardingRecord(JSON.parse(raw));
  } catch (error) {
    if (__DEV__) {
      console.warn('[onboarding] Could not read onboarding state', error);
    }
    return null;
  }
}

export async function writeOnboardingRecord(
  userId: string,
  record: OnboardingRecord,
): Promise<void> {
  try {
    await AsyncStorage.setItem(onboardingStorageKey(userId), JSON.stringify(record));
  } catch (error) {
    if (__DEV__) {
      console.warn('[onboarding] Could not save onboarding state', error);
    }
  }
}

/** Called only from sign-up so a brand-new account is not mistaken for an upgrade. */
export async function markNewUserOnboarding(userId: string): Promise<void> {
  const existing = await readOnboardingRecord(userId);
  if (existing?.flow === 'complete') return;
  await writeOnboardingRecord(userId, {
    flow: 'pending',
    audience: 'new',
    welcomeBack: 'seen',
    draft: existing?.draft ?? { step: 1, selected: [] },
  });
}

export async function hasLocalHabitsForUser(userId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem('habits');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    return parsed.some((habit) => {
      if (!habit || typeof habit !== 'object') return false;
      const owner = habit.userId ?? habit.user_id;
      const name = typeof habit.name === 'string' ? habit.name.trim() : '';
      return Boolean(name) && owner === userId;
    });
  } catch {
    return false;
  }
}

/** true / false when the query succeeds, null when it cannot be trusted. */
export async function hasRemoteHabits(userId: string): Promise<boolean | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const query = supabase
      .from('habit')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    const result = await Promise.race([
      query,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 4000);
      }),
    ]);
    if (!result || result.error) return null;
    return (result.data?.length ?? 0) > 0;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
