"use client";

import { useCallback, useSyncExternalStore } from "react";
import { PLATFORMS, type Platform } from "./snippets";

// The platform tab picked on /developers (and in the API key panel). Kept in
// localStorage so it survives reloads: returning to the browser tab can run a
// silent sign-in check that reloads the page (components/auth/SessionSync),
// and component state alone would snap back to the first tab. Every tab group
// reads the same value, so picking one updates them all.

const STORAGE_KEY = "lr:developers-platform";
const CHANGE_EVENT = "lr:developers-platform-change";
const DEFAULT: Platform = "unix";
let memory: Platform | null = null; // fallback when storage is unavailable

function isPlatform(v: unknown): v is Platform {
  return PLATFORMS.some((p) => p.id === v);
}

function read(): Platform {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isPlatform(stored)) return stored;
  } catch {
    // storage blocked (private mode, policy): fall back to memory
  }
  return memory ?? DEFAULT;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // other browser tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function usePlatform(): [Platform, (next: Platform) => void] {
  const platform = useSyncExternalStore(subscribe, read, () => DEFAULT);
  const setPlatform = useCallback((next: Platform) => {
    memory = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // memory fallback already set
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [platform, setPlatform];
}
