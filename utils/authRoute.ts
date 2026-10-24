export type AuthPhase = 'loading' | 'onboarding' | 'ready';

/**
 * Where a signed-in or signed-out session should sit.
 * Returns null when the current screen is already correct, or while onboarding
 * state is still loading (so the dashboard cannot flash first).
 */
export function getPostAuthHref(params: {
  hasUser: boolean;
  phase: AuthPhase;
  segment?: string;
}): '/login' | '/onboarding' | '/dashboard' | null {
  const segment = params.segment;

  if (!params.hasUser) {
    return segment === 'login' ? null : '/login';
  }

  if (params.phase === 'loading') return null;

  if (params.phase === 'onboarding') {
    return segment === 'onboarding' ? null : '/onboarding';
  }

  if (!segment || segment === 'index' || segment === 'login' || segment === 'onboarding') {
    return '/dashboard';
  }

  return null;
}
