import { createAnalyticsState } from "./createAnalyticsState";

const STORAGE_KEY = "royal-treasury-analytics-v1";
const AI_PERSONALITY_IDS = ["builder", "nobleHunter", "investor", "finisher"];

export function loadAnalytics() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return createAnalyticsState();

    const parsedValue = JSON.parse(storedValue);
    const emptyState = createAnalyticsState();
    const personalities = {};

    for (const id of AI_PERSONALITY_IDS) {
      personalities[id] = {
        ...emptyState.personalities[id],
        ...(parsedValue.personalities?.[id] || {}),
      };
    }

    return {
      ...emptyState,
      ...parsedValue,
      personalities,
      humanPlayers: parsedValue.humanPlayers || {},
      matchHistory: Array.isArray(parsedValue.matchHistory)
        ? parsedValue.matchHistory
        : [],
    };
  } catch {
    return createAnalyticsState();
  }
}

export function saveAnalytics(analytics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
}

export function clearAnalytics() {
  const emptyState = createAnalyticsState();
  saveAnalytics(emptyState);
  return emptyState;
}
