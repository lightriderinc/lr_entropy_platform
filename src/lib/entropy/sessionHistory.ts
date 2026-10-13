import type { EntropyResult } from "./generate";

// The current tab's recent draws, including their bytes, kept ONLY in this
// tab's sessionStorage (bytes are never stored on our servers; the permanent
// record of a draw is its signed receipt on the Receipts page).
//
// Every write reads what is already stored first. The console used to keep its
// own in-memory list that started empty on each visit and wrote it over the
// stored one, so returning to Get Entropy and drawing once left only that one.

const KEY = "entropy-history";
export const SESSION_HISTORY_LIMIT = 20;

export function readSessionHistory(): EntropyResult[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: EntropyResult[]): EntropyResult[] {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable: history is a convenience only
  }
  return items;
}

/** Add a draw to the front of what is already stored (newest first). */
export function appendSessionHistory(item: EntropyResult): EntropyResult[] {
  const rest = readSessionHistory().filter((x) => x.id !== item.id);
  return write([item, ...rest].slice(0, SESSION_HISTORY_LIMIT));
}

export function removeFromSessionHistory(id: string): EntropyResult[] {
  return write(readSessionHistory().filter((x) => x.id !== id));
}
