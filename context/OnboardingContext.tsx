import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { isDemoMode } from '@/utils/demoMode';
import {
  classifyOnboarding,
  readOnboardingMetadata,
  type OnboardingDraft,
  type OnboardingRecord,
} from '@/utils/onboardingClassification';
import {
  hasLocalHabitsForUser,
  hasRemoteHabits,
  readOnboardingRecord,
  writeOnboardingRecord,
} from '@/utils/onboardingState';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type OnboardingPhase = 'loading' | 'onboarding' | 'ready';

interface OnboardingSnapshot {
  userId: string;
  phase: 'onboarding' | 'ready';
  showWelcomeBack: boolean;
  draft: OnboardingDraft | null;
}

interface OnboardingContextType {
  phase: OnboardingPhase;
  showWelcomeBack: boolean;
  draft: OnboardingDraft | null;
  saveDraft: (draft: OnboardingDraft) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  /** Persist welcome-back as seen without unmounting the card already on screen. */
  acknowledgeWelcomeBack: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

function syncOnboardingMetadata(status: 'pending' | 'complete') {
  void supabase.auth.updateUser({ data: { mm_onboarding: status } }).catch((error) => {
    if (__DEV__) {
      console.warn('[onboarding] Could not sync onboarding metadata', error);
    }
  });
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const userIdRef = useRef<string | null>(null);
  const completedRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task, task);
    return queueRef.current;
  }, []);

  const userId = user?.id;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    userIdRef.current = userId ?? null;
    completedRef.current = false;
  }, [userId]);

  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser || !userId || isDemoMode()) return;

    let cancelled = false;
    const accountCreatedAt = currentUser.created_at;
    const metadata = readOnboardingMetadata(currentUser.user_metadata);

    const apply = (next: OnboardingSnapshot) => {
      if (!cancelled) setSnapshot(next);
    };

    (async () => {
      const stored = await readOnboardingRecord(userId);
      if (cancelled) return;

      if (stored) {
        const result = classifyOnboarding({
          stored,
          metadata,
          hasLocalHabits: false,
          hasRemoteHabits: false,
          accountCreatedAt,
        });
        if (result.persist) {
          await enqueue(() => writeOnboardingRecord(userId, result.persist as OnboardingRecord));
        }
        if (cancelled) return;
        apply({
          userId,
          phase: result.showOnboarding ? 'onboarding' : 'ready',
          showWelcomeBack: result.showWelcomeBack,
          draft: result.showOnboarding ? (stored.draft ?? null) : null,
        });
        return;
      }

      if (metadata) {
        const result = classifyOnboarding({
          stored: null,
          metadata,
          hasLocalHabits: false,
          hasRemoteHabits: false,
          accountCreatedAt,
        });
        if (result.persist) {
          await enqueue(() => writeOnboardingRecord(userId, result.persist as OnboardingRecord));
        }
        if (cancelled) return;
        apply({
          userId,
          phase: result.showOnboarding ? 'onboarding' : 'ready',
          showWelcomeBack: result.showWelcomeBack,
          draft: result.persist?.draft ?? null,
        });
        return;
      }

      const [hasLocalHabits, remoteHabits] = await Promise.all([
        hasLocalHabitsForUser(userId),
        hasRemoteHabits(userId),
      ]);
      if (cancelled) return;

      const result = classifyOnboarding({
        stored: null,
        metadata: null,
        hasLocalHabits,
        hasRemoteHabits: remoteHabits,
        accountCreatedAt,
      });
      if (result.persist) {
        await enqueue(() => writeOnboardingRecord(userId, result.persist as OnboardingRecord));
      }
      if (cancelled) return;
      apply({
        userId,
        phase: result.showOnboarding ? 'onboarding' : 'ready',
        showWelcomeBack: result.showWelcomeBack,
        draft: result.persist?.draft ?? null,
      });
    })().catch((error) => {
      if (__DEV__) {
        console.warn('[onboarding] Falling back to existing-user experience', error);
      }
      if (cancelled) return;
      apply({
        userId,
        phase: 'ready',
        showWelcomeBack: true,
        draft: null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enqueue, userId]);

  const activeSnapshot = user && snapshot && snapshot.userId === user.id ? snapshot : null;

  const phase: OnboardingPhase = !user || isDemoMode()
    ? 'ready'
    : activeSnapshot
      ? activeSnapshot.phase
      : 'loading';

  const showWelcomeBack = phase === 'ready' && activeSnapshot
    ? activeSnapshot.showWelcomeBack
    : false;

  const draft = activeSnapshot?.draft ?? null;

  const saveDraft = useCallback((nextDraft: OnboardingDraft) => {
    const userId = userIdRef.current;
    if (!userId || completedRef.current) return Promise.resolve();
    return enqueue(async () => {
      if (completedRef.current || userIdRef.current !== userId) return;
      const existing = await readOnboardingRecord(userId);
      if (completedRef.current || existing?.flow === 'complete') return;
      await writeOnboardingRecord(userId, {
        flow: 'pending',
        audience: 'new',
        welcomeBack: 'seen',
        draft: nextDraft,
      });
    });
  }, [enqueue]);

  const completeOnboarding = useCallback(() => {
    const userId = userIdRef.current;
    if (!userId) return Promise.resolve();
    completedRef.current = true;
    const record: OnboardingRecord = {
      flow: 'complete',
      audience: 'new',
      welcomeBack: 'seen',
    };
    setSnapshot({
      userId,
      phase: 'ready',
      showWelcomeBack: false,
      draft: null,
    });
    syncOnboardingMetadata('complete');
    return enqueue(() => writeOnboardingRecord(userId, record));
  }, [enqueue]);

  const acknowledgeWelcomeBack = useCallback(() => {
    const userId = userIdRef.current;
    if (!userId) return;
    setSnapshot((current) => {
      if (!current || current.userId !== userId) return current;
      return { ...current, showWelcomeBack: false };
    });
    void enqueue(async () => {
      const existing = await readOnboardingRecord(userId);
      const next: OnboardingRecord = existing
        ? { ...existing, welcomeBack: 'seen' }
        : { flow: 'complete', audience: 'existing', welcomeBack: 'seen' };
      await writeOnboardingRecord(userId, next);
    });
  }, [enqueue]);

  return (
    <OnboardingContext.Provider
      value={{
        phase,
        showWelcomeBack,
        draft,
        saveDraft,
        completeOnboarding,
        acknowledgeWelcomeBack,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
