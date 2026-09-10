import {
  feeRateForPlatform,
  filterEntriesByPeriod,
  filterEntriesByRange,
  groupByPlatform,
  netIncomeTrend,
  reconcileEntry,
  summarize,
  toInr,
  yearsInEntries,
} from "./reconciliation";
import type { IncomeEntry } from "./types";

function entry(overrides: Partial<IncomeEntry> = {}): IncomeEntry {
  return {
    id: "1",
    platform: "upwork",
    description: "Website project",
    grossAmount: 1000,
    currency: "INR",
    date: "2026-08-01",
    ...overrides,
  };
}

describe("toInr", () => {
  it("returns INR amounts unchanged (rounded)", () => {
    expect(toInr(1000, "INR")).toBe(1000);
  });

  it("converts USD to INR at the fixed demo rate", () => {
    expect(toInr(100, "USD")).toBe(8300);
  });

  it("throws on a negative amount", () => {
    expect(() => toInr(-5, "INR")).toThrow();
  });

  it("throws on a non-finite amount", () => {
    expect(() => toInr(NaN, "INR")).toThrow();
  });
});

describe("feeRateForPlatform", () => {
  it("returns the correct rate for each known platform", () => {
    expect(feeRateForPlatform("upwork")).toBe(0.1);
    expect(feeRateForPlatform("fiverr")).toBe(0.2);
    expect(feeRateForPlatform("direct")).toBe(0);
  });

  it("falls back to the 'other' rate for an unrecognized platform", () => {
    // @ts-expect-error intentionally passing an invalid platform to test the fallback
    expect(feeRateForPlatform("unknown-platform")).toBe(0.05);
  });
});

describe("reconcileEntry", () => {
  it("computes fee and net for an INR direct-client entry with zero fee", () => {
    const result = reconcileEntry(entry({ platform: "direct", grossAmount: 5000 }));
    expect(result.grossAmountInr).toBe(5000);
    expect(result.feeAmountInr).toBe(0);
    expect(result.netAmountInr).toBe(5000);
  });

  it("computes fee and net for a Fiverr USD entry", () => {
    const result = reconcileEntry(
      entry({ platform: "fiverr", grossAmount: 100, currency: "USD" })
    );
    expect(result.grossAmountInr).toBe(8300);
    expect(result.feeAmountInr).toBe(1660);
    expect(result.netAmountInr).toBe(6640);
  });
});

describe("summarize", () => {
  it("returns all-zero totals for an empty entry list", () => {
    const summary = summarize([]);
    expect(summary.totalGrossInr).toBe(0);
    expect(summary.totalFeesInr).toBe(0);
    expect(summary.totalNetInr).toBe(0);
    expect(summary.taxSetAsideInr).toBe(0);
    expect(summary.safeToSpendInr).toBe(0);
  });

  it("aggregates totals across multiple platforms and currencies", () => {
    const summary = summarize([
      entry({ id: "1", platform: "upwork", grossAmount: 1000, currency: "INR" }),
      entry({ id: "2", platform: "direct", grossAmount: 100, currency: "USD" }),
    ]);
    // upwork: 1000 gross, 100 fee, 900 net
    // direct: 8300 gross, 0 fee, 8300 net
    expect(summary.totalGrossInr).toBe(9300);
    expect(summary.totalFeesInr).toBe(100);
    expect(summary.totalNetInr).toBe(9200);
  });

  it("applies the default 30% tax set-aside to net income", () => {
    const summary = summarize([entry({ platform: "direct", grossAmount: 1000 })]);
    expect(summary.totalNetInr).toBe(1000);
    expect(summary.taxSetAsideInr).toBe(300);
    expect(summary.safeToSpendInr).toBe(700);
  });

  it("respects a custom tax set-aside rate", () => {
    const summary = summarize([entry({ platform: "direct", grossAmount: 1000 })], 0.5);
    expect(summary.taxSetAsideInr).toBe(500);
    expect(summary.safeToSpendInr).toBe(500);
  });

  it("throws for an out-of-range tax rate", () => {
    expect(() => summarize([], 1.5)).toThrow();
    expect(() => summarize([], -0.1)).toThrow();
  });

  it("keeps money math free of floating point drift across many entries", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry({ id: String(i), platform: "direct", grossAmount: 10.1 })
    );
    const summary = summarize(entries);
    expect(summary.totalGrossInr).toBe(101);
  });
});

describe("groupByPlatform", () => {
  it("returns an empty array for no entries", () => {
    expect(groupByPlatform([])).toEqual([]);
  });

  it("aggregates entries per platform and omits platforms with no entries", () => {
    const rows = groupByPlatform([
      entry({ id: "1", platform: "upwork", grossAmount: 1000, currency: "INR" }),
      entry({ id: "2", platform: "upwork", grossAmount: 500, currency: "INR" }),
      entry({ id: "3", platform: "direct", grossAmount: 200, currency: "INR" }),
    ]);
    expect(rows).toHaveLength(2);
    const upwork = rows.find((r) => r.platform === "upwork")!;
    expect(upwork.entryCount).toBe(2);
    expect(upwork.grossAmountInr).toBe(1500);
    expect(upwork.netAmountInr).toBe(1350); // 10% fee
    const fiverrRow = rows.find((r) => r.platform === "fiverr");
    expect(fiverrRow).toBeUndefined();
  });

  it("returns rows in a fixed platform order (upwork, fiverr, direct, other)", () => {
    const rows = groupByPlatform([
      entry({ id: "1", platform: "other", grossAmount: 100 }),
      entry({ id: "2", platform: "direct", grossAmount: 100 }),
      entry({ id: "3", platform: "upwork", grossAmount: 100 }),
    ]);
    expect(rows.map((r) => r.platform)).toEqual(["upwork", "direct", "other"]);
  });
});

describe("netIncomeTrend", () => {
  it("returns an empty array for no entries", () => {
    expect(netIncomeTrend([])).toEqual([]);
  });

  it("sorts points by date ascending", () => {
    const points = netIncomeTrend([
      entry({ id: "1", platform: "direct", date: "2026-08-20", grossAmount: 100 }),
      entry({ id: "2", platform: "direct", date: "2026-08-01", grossAmount: 100 }),
    ]);
    expect(points.map((p) => p.date)).toEqual(["2026-08-01", "2026-08-20"]);
  });

  it("collapses same-day entries into one point and accumulates cumulative net", () => {
    const points = netIncomeTrend([
      entry({ id: "1", platform: "direct", date: "2026-08-01", grossAmount: 100 }),
      entry({ id: "2", platform: "direct", date: "2026-08-01", grossAmount: 50 }),
      entry({ id: "3", platform: "direct", date: "2026-08-02", grossAmount: 25 }),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ date: "2026-08-01", netAmountInr: 150, cumulativeNetInr: 150 });
    expect(points[1]).toMatchObject({ date: "2026-08-02", netAmountInr: 25, cumulativeNetInr: 175 });
  });
});

describe("yearsInEntries", () => {
  it("returns an empty array for no entries", () => {
    expect(yearsInEntries([])).toEqual([]);
  });

  it("returns distinct years, descending", () => {
    const years = yearsInEntries([
      entry({ id: "1", date: "2025-03-01" }),
      entry({ id: "2", date: "2026-08-01" }),
      entry({ id: "3", date: "2025-11-01" }),
    ]);
    expect(years).toEqual([2026, 2025]);
  });
});

describe("filterEntriesByPeriod", () => {
  const entries = [
    entry({ id: "1", date: "2025-08-15" }),
    entry({ id: "2", date: "2026-08-01" }),
    entry({ id: "3", date: "2026-03-10" }),
  ];

  it("returns all entries when both year and month are null", () => {
    expect(filterEntriesByPeriod(entries, null, null)).toHaveLength(3);
  });

  it("filters by year only", () => {
    const result = filterEntriesByPeriod(entries, 2026, null);
    expect(result.map((e) => e.id).sort()).toEqual(["2", "3"]);
  });

  it("filters by year and month together", () => {
    const result = filterEntriesByPeriod(entries, 2026, 8);
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });

  it("filters by month across all years when year is null", () => {
    const result = filterEntriesByPeriod(entries, null, 8);
    expect(result.map((e) => e.id).sort()).toEqual(["1", "2"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterEntriesByPeriod(entries, 2024, null)).toEqual([]);
  });
});

describe("filterEntriesByRange", () => {
  const entries = [
    entry({ id: "1", date: "2026-08-01" }),
    entry({ id: "2", date: "2026-08-15" }),
    entry({ id: "3", date: "2026-08-31" }),
  ];

  it("returns all entries when both bounds are null", () => {
    expect(filterEntriesByRange(entries, null, null)).toHaveLength(3);
  });

  it("is inclusive of both the from and to dates", () => {
    const result = filterEntriesByRange(entries, "2026-08-01", "2026-08-31");
    expect(result).toHaveLength(3);
  });

  it("excludes entries before the from date", () => {
    const result = filterEntriesByRange(entries, "2026-08-10", null);
    expect(result.map((e) => e.id)).toEqual(["2", "3"]);
  });

  it("excludes entries after the to date", () => {
    const result = filterEntriesByRange(entries, null, "2026-08-10");
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });

  it("narrows to a tight range with both bounds", () => {
    const result = filterEntriesByRange(entries, "2026-08-05", "2026-08-20");
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });
});
