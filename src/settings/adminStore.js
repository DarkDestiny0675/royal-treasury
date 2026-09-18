import { useSyncExternalStore } from "react";

const SESSION_KEY = "royal-treasury-admin-unlocked";
const ADMIN_CODE = "Trinity";
const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isAdminUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function unlockAdmin(code) {
  const isValid = String(code || "").trim() === ADMIN_CODE;
  if (isValid) {
    sessionStorage.setItem(SESSION_KEY, "true");
    emitChange();
  }
  return isValid;
}

export function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
  emitChange();
}

export function useAdminAccess() {
  return useSyncExternalStore(subscribe, isAdminUnlocked, () => false);
}
