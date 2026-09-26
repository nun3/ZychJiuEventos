export const ONBOARDING_STORAGE_PREFIX = 'mc-onboarding'

export type OnboardingPreferenceState = {
  checklistHidden: boolean
  coachmarks: Record<string, boolean>
}

export function onboardingStorageKey(userId: string) {
  return `${ONBOARDING_STORAGE_PREFIX}:${userId}`
}

export function emptyOnboardingPreferences(): OnboardingPreferenceState {
  return { checklistHidden: false, coachmarks: {} }
}

export function parseOnboardingPreferences(raw: string | null): OnboardingPreferenceState {
  if (!raw) return emptyOnboardingPreferences()
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingPreferenceState>
    return {
      checklistHidden: parsed.checklistHidden === true,
      coachmarks: parsed.coachmarks && typeof parsed.coachmarks === 'object' ? parsed.coachmarks : {},
    }
  } catch {
    return emptyOnboardingPreferences()
  }
}

export function isCoachmarkDismissed(state: OnboardingPreferenceState, id: string) {
  return state.coachmarks[id] === true
}
