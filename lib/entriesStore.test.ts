/**
 * @jest-environment jsdom
 */
import { addEntry, loadEntries, removeEntry, updateEntry } from "./entriesStore";
import type { IncomeEntry } from "./types";

const EMAIL = "test@example.com";

function entry(overrides: Partial<IncomeEntry> = {}): IncomeEntry {
  return {
    id: "custom-1",
    platform: "upwork",
    description: "Website project",
    grossAmount: 1000,
    currency: "INR",
    date: "2026-08-01",
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("loadEntries", () => {
  it("seeds a new account with sample entries on first load", () => {
    const entries = loadEntries(EMAIL);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("returns the same seeded entries on a second load (does not reseed)", () => {
    const first = loadEntries(EMAIL);
    addEntry(EMAIL, entry());
    const second = loadEntries(EMAIL);
    expect(second.length).toBe(first.length + 1);
  });

  it("keeps entries isolated per user", () => {
    loadEntries(EMAIL);
    addEntry(EMAIL, entry({ id: "only-for-a" }));
    const otherUserEntries = loadEntries("other@example.com");
    expect(otherUserEntries.some((e) => e.id === "only-for-a")).toBe(false);
  });
});

describe("addEntry", () => {
  it("appends a new entry and persists it", () => {
    loadEntries(EMAIL);
    const updated = addEntry(EMAIL, entry({ id: "new-1" }));
    expect(updated.some((e) => e.id === "new-1")).toBe(true);
    expect(loadEntries(EMAIL).some((e) => e.id === "new-1")).toBe(true);
  });
});

describe("removeEntry", () => {
  it("removes the entry with the given id", () => {
    loadEntries(EMAIL);
    addEntry(EMAIL, entry({ id: "to-remove" }));
    const updated = removeEntry(EMAIL, "to-remove");
    expect(updated.some((e) => e.id === "to-remove")).toBe(false);
  });
});

describe("updateEntry", () => {
  it("replaces the matching entry's fields", () => {
    loadEntries(EMAIL);
    addEntry(EMAIL, entry({ id: "editable", description: "Original" }));
    const updated = updateEntry(EMAIL, entry({ id: "editable", description: "Edited" }));
    const found = updated.find((e) => e.id === "editable");
    expect(found?.description).toBe("Edited");
  });

  it("leaves other entries untouched", () => {
    loadEntries(EMAIL);
    addEntry(EMAIL, entry({ id: "a", description: "A" }));
    addEntry(EMAIL, entry({ id: "b", description: "B" }));
    const updated = updateEntry(EMAIL, entry({ id: "a", description: "A-edited" }));
    expect(updated.find((e) => e.id === "b")?.description).toBe("B");
  });
});
