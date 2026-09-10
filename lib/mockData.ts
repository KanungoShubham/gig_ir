import type { IncomeEntry } from "./types";

/** Seed data so the dashboard has something to reconcile on first load. */
export const SAMPLE_ENTRIES: IncomeEntry[] = [
  {
    id: "seed-1",
    platform: "upwork",
    description: "Landing page redesign",
    grossAmount: 250,
    currency: "USD",
    date: "2026-08-03",
  },
  {
    id: "seed-2",
    platform: "fiverr",
    description: "Logo pack (3 concepts)",
    grossAmount: 60,
    currency: "USD",
    date: "2026-08-10",
  },
  {
    id: "seed-3",
    platform: "direct",
    description: "Monthly retainer - Acme Co",
    grossAmount: 35000,
    currency: "INR",
    date: "2026-08-15",
  },
  {
    id: "seed-4",
    platform: "upwork",
    description: "API integration bugfixes",
    grossAmount: 180,
    currency: "USD",
    date: "2026-08-22",
  },
];
