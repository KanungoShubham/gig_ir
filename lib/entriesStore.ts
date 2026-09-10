import { SAMPLE_ENTRIES } from "./mockData";
import type { IncomeEntry } from "./types";

/**
 * Per-user entry storage in localStorage. There's no backend in this demo —
 * see README "Assumptions" (item on data persistence). Each signed-in user
 * gets their own key so switching demo accounts doesn't mix data.
 */
function storageKey(email: string): string {
  return `income-reconciler:entries:${email}`;
}

export function loadEntries(email: string): IncomeEntry[] {
  const raw = localStorage.getItem(storageKey(email));
  if (!raw) {
    // Seed new accounts with sample data so the dashboard isn't empty.
    saveEntries(email, SAMPLE_ENTRIES);
    return SAMPLE_ENTRIES;
  }
  try {
    return JSON.parse(raw) as IncomeEntry[];
  } catch {
    return [];
  }
}

export function saveEntries(email: string, entries: IncomeEntry[]): void {
  localStorage.setItem(storageKey(email), JSON.stringify(entries));
}

export function addEntry(email: string, entry: IncomeEntry): IncomeEntry[] {
  const entries = [...loadEntries(email), entry];
  saveEntries(email, entries);
  return entries;
}

export function removeEntry(email: string, entryId: string): IncomeEntry[] {
  const entries = loadEntries(email).filter((e) => e.id !== entryId);
  saveEntries(email, entries);
  return entries;
}

export function updateEntry(email: string, updated: IncomeEntry): IncomeEntry[] {
  const entries = loadEntries(email).map((e) => (e.id === updated.id ? updated : e));
  saveEntries(email, entries);
  return entries;
}
