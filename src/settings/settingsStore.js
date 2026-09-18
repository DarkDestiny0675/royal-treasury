import { useSyncExternalStore } from "react";

const PREFIX = "royal-treasury-setting-";
const listeners = new Set();

function storageKey(key) {
  return `${PREFIX}${key}`;
}

export function getSetting(key, initialValue) {
  try {
    const saved = localStorage.getItem(storageKey(key));
    return saved === null ? initialValue : JSON.parse(saved);
  } catch {
    return initialValue;
  }
}

export function setSetting(key, value) {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
  listeners.forEach((listener) => listener());
  window.dispatchEvent(
    new CustomEvent("royal-treasury-setting-changed", {
      detail: { key, value },
    }),
  );
}

function subscribe(listener) {
  listeners.add(listener);

  function handleStorage(event) {
    if (event.key?.startsWith(PREFIX)) listener();
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useStoredSetting(key, initialValue) {
  const value = useSyncExternalStore(
    subscribe,
    () => getSetting(key, initialValue),
    () => initialValue,
  );

  return [value, (nextValue) => setSetting(key, nextValue)];
}
