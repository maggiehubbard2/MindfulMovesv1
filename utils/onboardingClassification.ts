/**
 * Decides whether to show new-user onboarding or the existing-user welcome-back.
 *
 * This build is an update to an already-released app. A missing onboarding flag
 * must not be treated as "this person is new."
 *
 * Persisted per account in AsyncStorage at `mm.onboarding.v1.<userId>`:
 * - `flow: pending` — new user still in onboarding (also written at sign-up)
 * - `flow: complete` + `audience: new` — finished or skipped onboarding; no welcome-back
 * - `flow: complete` + `audience: existing` + `welcomeBack` — upgrade / reinstall path
 *
 * Auth user metadata `mm_onboarding` (`pending` | `complete`) is written only for
 * people who sign up or finish onboarding in this version. It is a cross-device
 * hint. It is never written for existing accounts, and a missing value is ignored.
 *
 * When neither local state nor metadata exists:
 * - Any saved habit, or a habit row on the server, means an existing user.
 * - An account older than NEW_ACCOUNT_WINDOW_MS means an existing user, even
 *   with zero habits.
 * - If the habit lookup fails, treat them as existing (do not block on onboarding).
 * - Onboarding is shown only when the server confirms zero habits and the
 *   account was created moments ago (sign-up flag write failed).
 *
 * Welcome-back is local to the installation. Reinstalling or signing in on a
 * new device can show it once more. It does not repeat new-user onboarding and
 * does not change habits, streaks, or settings.
 */

export const NEW_ACCOUNT_WINDOW_MS = 2 * 60 * 1000;

export const ONBOARDING_STORAGE_PREFIX = 'mm.onboarding.v1.';

export type OnboardingFlow = 'pending' | 'complete';
export type OnboardingAudience = 'new' | 'existing';
export type WelcomeBackStatus = 'unseen' | 'seen';
export type OnboardingMetadata = 'pending' | 'complete' | null;

export interface OnboardingDraftHabit {
  name: string;
  description?: string;
}

export interface OnboardingDraft {
  step: 1 | 2 | 3;
  selected: OnboardingDraftHabit[];
}

export interface OnboardingRecord {
  flow: OnboardingFlow;
  audience: OnboardingAudience;
  welcomeBack: WelcomeBackStatus;
  draft?: OnboardingDraft;
}

export interface ClassificationInput {
  stored: OnboardingRecord | null;
  metadata: OnboardingMetadata;
  hasLocalHabits: boolean;
  /** null when the server could not be reached or the query failed. */
  hasRemoteHabits: boolean | null;
  accountCreatedAt?: string | null;
  now?: number;
}

export interface Classification {
  showOnboarding: boolean;
  showWelcomeBack: boolean;
  /** Record to write when nothing trustworthy was stored yet. */
  persist: OnboardingRecord | null;
}

export function onboardingStorageKey(userId: string): string {
  return `${ONBOARDING_STORAGE_PREFIX}${userId}`;
}

export function habitNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function isBrandNewAccount(
  createdAt: string | null | undefined,
  now: number,
): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  const age = now - created;
  return age >= 0 && age < NEW_ACCOUNT_WINDOW_MS;
}

export function readOnboardingMetadata(
  userMetadata: Record<string, unknown> | null | undefined,
): OnboardingMetadata {
  const value = userMetadata?.mm_onboarding;
  if (value === 'pending' || value === 'complete') return value;
  return null;
}

function newUserRecord(draft?: OnboardingDraft): OnboardingRecord {
  return {
    flow: 'pending',
    audience: 'new',
    welcomeBack: 'seen',
    draft: draft ?? { step: 1, selected: [] },
  };
}

function existingUserRecord(): OnboardingRecord {
  return {
    flow: 'complete',
    audience: 'existing',
    welcomeBack: 'unseen',
  };
}

export function classifyOnboarding(input: ClassificationInput): Classification {
  const now = input.now ?? Date.now();
  const stored = input.stored;

  // Finished onboarding on this or another device. Never show the new-user
  // flow or the existing-user welcome-back afterward.
  if (input.metadata === 'complete' && stored?.audience !== 'existing') {
    const alreadyStored = stored?.flow === 'complete' && stored.audience === 'new';
    return {
      showOnboarding: false,
      showWelcomeBack: false,
      persist: alreadyStored
        ? null
        : { flow: 'complete', audience: 'new', welcomeBack: 'seen' },
    };
  }

  if (stored?.flow === 'pending' && stored.audience === 'new') {
    return { showOnboarding: true, showWelcomeBack: false, persist: null };
  }

  if (stored?.flow === 'complete') {
    return {
      showOnboarding: false,
      showWelcomeBack: stored.audience === 'existing' && stored.welcomeBack !== 'seen',
      persist: null,
    };
  }

  if (input.metadata === 'pending') {
    return { showOnboarding: true, showWelcomeBack: false, persist: newUserRecord() };
  }

  const confirmedNoHabits = !input.hasLocalHabits && input.hasRemoteHabits === false;
  const brandNew = isBrandNewAccount(input.accountCreatedAt, now);

  if (confirmedNoHabits && brandNew) {
    return { showOnboarding: true, showWelcomeBack: false, persist: newUserRecord() };
  }

  return {
    showOnboarding: false,
    showWelcomeBack: true,
    persist: existingUserRecord(),
  };
}

export function parseOnboardingRecord(value: unknown): OnboardingRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<OnboardingRecord>;
  const flow = record.flow;
  const audience = record.audience;
  const welcomeBack = record.welcomeBack;
  if (flow !== 'pending' && flow !== 'complete') return null;
  if (audience !== 'new' && audience !== 'existing') return null;
  if (welcomeBack !== 'unseen' && welcomeBack !== 'seen') return null;

  const parsed: OnboardingRecord = {
    flow,
    audience,
    welcomeBack,
  };
  const draft = parseDraft(record.draft);
  if (draft) parsed.draft = draft;
  return parsed;
}

function parseDraft(value: unknown): OnboardingDraft | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const draft = value as Partial<OnboardingDraft>;
  if (draft.step !== 1 && draft.step !== 2 && draft.step !== 3) return undefined;
  if (!Array.isArray(draft.selected)) return undefined;

  const selected: OnboardingDraftHabit[] = [];
  for (const item of draft.selected) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) continue;
    const description =
      typeof item.description === 'string' && item.description.trim()
        ? item.description.trim()
        : undefined;
    selected.push(description ? { name, description } : { name });
    if (selected.length === 3) break;
  }

  return { step: draft.step, selected };
}
