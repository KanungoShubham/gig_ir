export type Platform = "upwork" | "fiverr" | "direct" | "other";

export type Currency = "INR" | "USD";

export interface IncomeEntry {
  id: string;
  platform: Platform;
  description: string;
  grossAmount: number;
  currency: Currency;
  date: string; // ISO date string, e.g. "2026-08-15"
}

export interface ReconciledEntry extends IncomeEntry {
  grossAmountInr: number;
  feeRate: number;
  feeAmountInr: number;
  netAmountInr: number;
}

export interface ReconciliationSummary {
  entries: ReconciledEntry[];
  totalGrossInr: number;
  totalFeesInr: number;
  totalNetInr: number;
  taxSetAsideInr: number;
  safeToSpendInr: number;
}
