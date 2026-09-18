import { useSyncExternalStore } from "react";

const STORAGE_KEY = "royal-treasury-player-profile-v1";
const listeners = new Set();
let cachedProfile = null;
let cachedRawValue = null;

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeProfile(profile) {
  return {
    id: profile?.id || createId(),
    displayName:
      String(profile?.displayName || "Michael").trim() || "Michael",
    statsResetAt: profile?.statsResetAt || null,
  };
}

function readStoredProfile() {
  const rawValue = localStorage.getItem(STORAGE_KEY);

  if (cachedProfile && rawValue === cachedRawValue) {
    return cachedProfile;
  }

  if (rawValue) {
    try {
      cachedProfile = normalizeProfile(JSON.parse(rawValue));
      cachedRawValue = rawValue;
      return cachedProfile;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  cachedProfile = normalizeProfile({ displayName: "Michael" });
  cachedRawValue = JSON.stringify(cachedProfile);
  localStorage.setItem(STORAGE_KEY, cachedRawValue);
  return cachedProfile;
}

export function loadPlayerProfile() {
  return readStoredProfile();
}

export function clearPlayerStatistics() {
  const current = readStoredProfile();
  return savePlayerProfile({
    ...current,
    statsResetAt: new Date().toISOString(),
  });
}

export function savePlayerProfile(profile) {
  const normalized = normalizeProfile(profile);
  const rawValue = JSON.stringify(normalized);

  cachedProfile = normalized;
  cachedRawValue = rawValue;
  localStorage.setItem(STORAGE_KEY, rawValue);
  listeners.forEach((listener) => listener());

  return cachedProfile;
}

function subscribe(listener) {
  listeners.add(listener);

  function handleStorage(event) {
    if (event.key !== STORAGE_KEY) return;
    cachedProfile = null;
    cachedRawValue = null;
    listener();
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerSnapshot() {
  return cachedProfile || { id: "server-player", displayName: "Michael" };
}

export function usePlayerProfile() {
  return useSyncExternalStore(subscribe, readStoredProfile, getServerSnapshot);
}
