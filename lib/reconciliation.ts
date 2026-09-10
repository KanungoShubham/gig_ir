import type {
  Currency,
  IncomeEntry,
  Platform,
  ReconciledEntry,
  ReconciliationSummary,
} from "./types";

/**
 * Platform fee rates are flat approximations of each platform's typical cut
 * (Upwork's real fee is tiered by lifetime billings with a client; Fiverr's
 * varies by seller level). A flat rate keeps the demo simple — see README
 * "Assumptions".
 */
const PLATFORM_FEE_RATES: Record<Platform, number> = {
  upwork: 0.1,
  fiverr: 0.2,
  direct: 0,
  other: 0.05,
};

/** Fixed demo FX rate. A real version would call a live rates API. */
const USD_TO_INR_RATE = 83;

/** Recommended tax + buffer set-aside, applied to net (post-fee) income. */
const DEFAULT_TAX_SET_ASIDE_RATE = 0.3;

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toInr(amount: number, currency: Currency): number {
  if (amount < 0 || !Number.isFinite(amount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return currency === "USD" ? round2(amount * USD_TO_INR_RATE) : round2(amount);
}

export function feeRateForPlatform(platform: Platform): number {
  return PLATFORM_FEE_RATES[platform] ?? PLATFORM_FEE_RATES.other;
}

export function reconcileEntry(entry: IncomeEntry): ReconciledEntry {
  const grossAmountInr = toInr(entry.grossAmount, entry.currency);
  const feeRate = feeRateForPlatform(entry.platform);
  const feeAmountInr = round2(grossAmountInr * feeRate);
  const netAmountInr = round2(grossAmountInr - feeAmountInr);

  return {
    ...entry,
    grossAmountInr,
    feeRate,
    feeAmountInr,
    netAmountInr,
  };
}

export function summarize(
  entries: IncomeEntry[],
  taxSetAsideRate: number = DEFAULT_TAX_SET_ASIDE_RATE
): ReconciliationSummary {
  if (taxSetAsideRate < 0 || taxSetAsideRate > 1) {
    throw new Error("taxSetAsideRate must be between 0 and 1");
  }

  const reconciled = entries.map(reconcileEntry);

  const totalGrossInr = round2(
    reconciled.reduce((sum, e) => sum + e.grossAmountInr, 0)
  );
  const totalFeesInr = round2(
    reconciled.reduce((sum, e) => sum + e.feeAmountInr, 0)
  );
  const totalNetInr = round2(
    reconciled.reduce((sum, e) => sum + e.netAmountInr, 0)
  );
  const taxSetAsideInr = round2(totalNetInr * taxSetAsideRate);
  const safeToSpendInr = round2(totalNetInr - taxSetAsideInr);

  return {
    entries: reconciled,
    totalGrossInr,
    totalFeesInr,
    totalNetInr,
    taxSetAsideInr,
    safeToSpendInr,
  };
}

export interface PlatformBreakdown {
  platform: Platform;
  grossAmountInr: number;
  feeAmountInr: number;
  netAmountInr: number;
  entryCount: number;
}

/** Fixed display order — matches the categorical color order used in the UI. */
const PLATFORM_ORDER: Platform[] = ["upwork", "fiverr", "direct", "other"];

/** Aggregates reconciled entries by platform, in a fixed display order. */
export function groupByPlatform(entries: IncomeEntry[]): PlatformBreakdown[] {
  const reconciled = entries.map(reconcileEntry);

  return PLATFORM_ORDER.map((platform) => {
    const forPlatform = reconciled.filter((e) => e.platform === platform);
    return {
      platform,
      grossAmountInr: round2(forPlatform.reduce((sum, e) => sum + e.grossAmountInr, 0)),
      feeAmountInr: round2(forPlatform.reduce((sum, e) => sum + e.feeAmountInr, 0)),
      netAmountInr: round2(forPlatform.reduce((sum, e) => sum + e.netAmountInr, 0)),
      entryCount: forPlatform.length,
    };
  }).filter((row) => row.entryCount > 0);
}

export interface TrendPoint {
  date: string;
  netAmountInr: number;
  cumulativeNetInr: number;
}

/**
 * Net income over time, sorted by date ascending. Multiple entries on the
 * same date are collapsed into one point so the trend line has one value
 * per date.
 */
export function netIncomeTrend(entries: IncomeEntry[]): TrendPoint[] {
  const reconciled = [...entries.map(reconcileEntry)].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const byDate = new Map<string, number>();
  for (const entry of reconciled) {
    byDate.set(entry.date, round2((byDate.get(entry.date) ?? 0) + entry.netAmountInr));
  }

  let cumulative = 0;
  return Array.from(byDate.entries()).map(([date, netAmountInr]) => {
    cumulative = round2(cumulative + netAmountInr);
    return { date, netAmountInr, cumulativeNetInr: cumulative };
  });
}

/**
 * Distinct years present in a list of entries, descending (newest first).
 * Drives the year filter's options.
 */
export function yearsInEntries(entries: IncomeEntry[]): number[] {
  const years = new Set(entries.map((e) => Number(e.date.slice(0, 4))));
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Filters entries to a given year and/or month (1-12). `null` for either
 * means "all" for that dimension — a month filter with no year filters
 * across every year for that calendar month.
 */
export function filterEntriesByPeriod(
  entries: IncomeEntry[],
  year: number | null,
  month: number | null
): IncomeEntry[] {
  return entries.filter((entry) => {
    const entryYear = Number(entry.date.slice(0, 4));
    const entryMonth = Number(entry.date.slice(5, 7));
    if (year !== null && entryYear !== year) return false;
    if (month !== null && entryMonth !== month) return false;
    return true;
  });
}

/**
 * Filters entries to an inclusive [from, to] date range (ISO "YYYY-MM-DD").
 * Either bound may be null to leave that side open-ended. Dates compare
 * correctly as plain strings since they're always zero-padded ISO.
 */
export function filterEntriesByRange(
  entries: IncomeEntry[],
  from: string | null,
  to: string | null
): IncomeEntry[] {
  return entries.filter((entry) => {
    if (from !== null && entry.date < from) return false;
    if (to !== null && entry.date > to) return false;
    return true;
  });
}
