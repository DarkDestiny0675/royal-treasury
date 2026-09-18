import { useSyncExternalStore } from "react";
import { loadAccountSession } from "../services/authApi";
const KEY = "royal-treasury-online-token",
  listeners = new Set();
let currentUser = null,
  initialized = false;
const emit = () => listeners.forEach((f) => f());
const subscribe = (f) => (listeners.add(f), () => listeners.delete(f));
export function getAuthToken() {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
}
const clear = () => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
};
export function saveAuthSession({ token, user }, remember = false) {
  clear();
  (remember ? localStorage : sessionStorage).setItem(KEY, token);
  currentUser = user;
  initialized = true;
  emit();
}
export function clearAuthSession() {
  clear();
  currentUser = null;
  initialized = true;
  emit();
}
export async function restoreAuthSession() {
  if (initialized) return currentUser;
  initialized = true;
  const token = getAuthToken();
  if (token)
    try {
      currentUser = (await loadAccountSession(token)).user;
    } catch {
      clear();
      currentUser = null;
    }
  emit();
  return currentUser;
}
export function useAuthSession() {
  return useSyncExternalStore(
    subscribe,
    () => currentUser,
    () => null,
  );
}
