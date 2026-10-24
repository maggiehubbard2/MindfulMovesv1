import assert from 'node:assert/strict';
import test from 'node:test';
import { getPostAuthHref } from './authRoute.ts';
import {
  NEW_ACCOUNT_WINDOW_MS,
  classifyOnboarding,
  isBrandNewAccount,
  parseOnboardingRecord,
  type OnboardingRecord,
} from './onboardingClassification.ts';

const NOW = Date.parse('2026-10-23T18:00:00.000Z');
const BRAND_NEW = new Date(NOW - 30_000).toISOString();
const ESTABLISHED = new Date(NOW - NEW_ACCOUNT_WINDOW_MS - 1).toISOString();

const base = {
  stored: null,
  metadata: null as const,
  hasLocalHabits: false,
  hasRemoteHabits: false as boolean | null,
  accountCreatedAt: ESTABLISHED,
  now: NOW,
};

test('metadata complete overrides a stale local pending draft', () => {
  const result = classifyOnboarding({
    ...base,
    stored: {
      flow: 'pending',
      audience: 'new',
      welcomeBack: 'seen',
      draft: { step: 2, selected: [{ name: 'Read 5 pages' }] },
    },
    metadata: 'complete',
    accountCreatedAt: ESTABLISHED,
  });
  assert.equal(result.showOnboarding, false);
  assert.equal(result.showWelcomeBack, false);
  assert.equal(result.persist?.flow, 'complete');
  assert.equal(result.persist?.audience, 'new');
});

test('pending local record resumes onboarding and hides welcome-back', () => {
  const stored: OnboardingRecord = {
    flow: 'pending',
    audience: 'new',
    welcomeBack: 'seen',
    draft: { step: 2, selected: [{ name: 'Read 5 pages' }] },
  };
  const result = classifyOnboarding({
    ...base,
    stored,
    hasRemoteHabits: true,
    accountCreatedAt: ESTABLISHED,
  });
  assert.equal(result.showOnboarding, true);
  assert.equal(result.showWelcomeBack, false);
  assert.equal(result.persist, null);
});

test('completed new users do not see welcome-back', () => {
  const result = classifyOnboarding({
    ...base,
    stored: { flow: 'complete', audience: 'new', welcomeBack: 'seen' },
    accountCreatedAt: BRAND_NEW,
  });
  assert.equal(result.showOnboarding, false);
  assert.equal(result.showWelcomeBack, false);
});

test('existing users with an unseen welcome-back see it once', () => {
  const unseen = classifyOnboarding({
    ...base,
    stored: { flow: 'complete', audience: 'existing', welcomeBack: 'unseen' },
  });
  assert.equal(unseen.showOnboarding, false);
  assert.equal(unseen.showWelcomeBack, true);

  const seen = classifyOnboarding({
    ...base,
    stored: { flow: 'complete', audience: 'existing', welcomeBack: 'seen' },
  });
  assert.equal(seen.showWelcomeBack, false);
});

test('missing flag plus habits classifies an existing user', () => {
  const remote = classifyOnboarding({
    ...base,
    hasRemoteHabits: true,
    accountCreatedAt: BRAND_NEW,
  });
  assert.equal(remote.showOnboarding, false);
  assert.equal(remote.showWelcomeBack, true);
  assert.equal(remote.persist?.audience, 'existing');

  const local = classifyOnboarding({
    ...base,
    hasLocalHabits: true,
    hasRemoteHabits: false,
    accountCreatedAt: BRAND_NEW,
  });
  assert.equal(local.showOnboarding, false);
  assert.equal(local.persist?.audience, 'existing');
});

test('missing flag on an established account with no habits is not new-user onboarding', () => {
  const result = classifyOnboarding({
    ...base,
    hasRemoteHabits: false,
    accountCreatedAt: ESTABLISHED,
  });
  assert.equal(result.showOnboarding, false);
  assert.equal(result.showWelcomeBack, true);
  assert.equal(result.persist?.flow, 'complete');
  assert.equal(result.persist?.audience, 'existing');
});

test('brand-new account with confirmed zero habits can enter onboarding', () => {
  const result = classifyOnboarding({
    ...base,
    hasRemoteHabits: false,
    accountCreatedAt: BRAND_NEW,
  });
  assert.equal(result.showOnboarding, true);
  assert.equal(result.showWelcomeBack, false);
  assert.equal(result.persist?.audience, 'new');
  assert.equal(result.persist?.welcomeBack, 'seen');
});

test('unknown habit lookup falls back to existing user', () => {
  const result = classifyOnboarding({
    ...base,
    hasRemoteHabits: null,
    accountCreatedAt: BRAND_NEW,
  });
  assert.equal(result.showOnboarding, false);
  assert.equal(result.showWelcomeBack, true);
  assert.equal(result.persist?.audience, 'existing');
});

test('metadata pending and complete override a missing local flag', () => {
  const pending = classifyOnboarding({
    ...base,
    metadata: 'pending',
    hasRemoteHabits: false,
    accountCreatedAt: ESTABLISHED,
  });
  assert.equal(pending.showOnboarding, true);
  assert.equal(pending.showWelcomeBack, false);

  const complete = classifyOnboarding({
    ...base,
    metadata: 'complete',
    accountCreatedAt: BRAND_NEW,
    hasRemoteHabits: false,
  });
  assert.equal(complete.showOnboarding, false);
  assert.equal(complete.showWelcomeBack, false);
  assert.equal(complete.persist?.audience, 'new');
});

test('account age window treats unknown or old dates as established', () => {
  assert.equal(isBrandNewAccount(BRAND_NEW, NOW), true);
  assert.equal(isBrandNewAccount(ESTABLISHED, NOW), false);
  assert.equal(isBrandNewAccount(null, NOW), false);
  assert.equal(isBrandNewAccount('not-a-date', NOW), false);
  assert.equal(
    isBrandNewAccount(new Date(NOW + 60_000).toISOString(), NOW),
    false,
  );
});

test('corrupt stored payloads are ignored', () => {
  assert.equal(parseOnboardingRecord(null), null);
  assert.equal(parseOnboardingRecord({ flow: 'nope' }), null);
  const parsed = parseOnboardingRecord({
    flow: 'pending',
    audience: 'new',
    welcomeBack: 'seen',
    draft: {
      step: 2,
      selected: [{ name: '  Read 5 pages  ', description: '  ' }, { name: '' }, 'nope'],
    },
  });
  assert.deepEqual(parsed, {
    flow: 'pending',
    audience: 'new',
    welcomeBack: 'seen',
    draft: { step: 2, selected: [{ name: 'Read 5 pages' }] },
  });
});

test('navigation waits while onboarding state loads and then picks one destination', () => {
  assert.equal(getPostAuthHref({ hasUser: false, phase: 'ready', segment: 'login' }), null);
  assert.equal(getPostAuthHref({ hasUser: false, phase: 'ready' }), '/login');
  assert.equal(getPostAuthHref({ hasUser: true, phase: 'loading', segment: 'login' }), null);
  assert.equal(getPostAuthHref({ hasUser: true, phase: 'onboarding', segment: 'login' }), '/onboarding');
  assert.equal(getPostAuthHref({ hasUser: true, phase: 'onboarding', segment: 'onboarding' }), null);
  assert.equal(getPostAuthHref({ hasUser: true, phase: 'ready', segment: 'onboarding' }), '/dashboard');
  assert.equal(getPostAuthHref({ hasUser: true, phase: 'ready', segment: '(tabs)' }), null);
});
