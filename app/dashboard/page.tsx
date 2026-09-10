"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentUser, logOut } from "@/lib/auth";
import { addEntry, loadEntries, removeEntry, updateEntry } from "@/lib/entriesStore";
import { summarize } from "@/lib/reconciliation";
import type { IncomeEntry } from "@/lib/types";
import { EntryForm } from "@/components/EntryForm";
import { EntryTable } from "@/components/EntryTable";
import { StatCard, formatInr } from "@/components/StatCard";
import { RecentEntriesList } from "@/components/RecentEntriesList";
import { SafeToSpendCard } from "@/components/SafeToSpendCard";
import { PlatformDonutChart } from "@/components/charts/PlatformDonutChart";
import { IncomeTrendChart } from "@/components/charts/IncomeTrendChart";
import {
  filterEntriesByPeriod,
  filterEntriesByRange,
  groupByPlatform,
  netIncomeTrend,
  yearsInEntries,
} from "@/lib/reconciliation";
import { Toast } from "@/components/Toast";
import { PeriodFilter } from "@/components/PeriodFilter";
import { DateRangePicker } from "@/components/DateRangePicker";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterFrom, setFilterFrom] = useState<string | null>(null);
  const [filterTo, setFilterTo] = useState<string | null>(null);

  useEffect(() => {
    const user = currentUser();
    if (!user) {
      router.replace("/");
      return;
    }
    setEmail(user);
    setEntries(loadEntries(user));

    const pendingToast = sessionStorage.getItem("income-reconciler:toast");
    if (pendingToast) {
      sessionStorage.removeItem("income-reconciler:toast");
      setToast(pendingToast);
    }
  }, [router]);

  // Kept separate from the effect above so the auto-dismiss timer is keyed
  // off the `toast` state itself, not the one-time sessionStorage read —
  // React 18 StrictMode double-invokes effects in dev, which would otherwise
  // consume the sessionStorage flag on the first pass and skip scheduling
  // the timer on the second, leaving the toast stuck on screen.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleAdd(entry: IncomeEntry) {
    if (!email) return;
    setEntries(addEntry(email, entry));
    setAddOpen(false);

    // If the active filter would hide the entry just added, clear it —
    // otherwise the entry saves fine but silently disappears from view,
    // which reads as "add entry" not working.
    const entryYear = Number(entry.date.slice(0, 4));
    const entryMonth = Number(entry.date.slice(5, 7));
    const hiddenByPeriod =
      (filterYear !== null && entryYear !== filterYear) ||
      (filterMonth !== null && entryMonth !== filterMonth);
    const hiddenByRange =
      (filterFrom !== null && entry.date < filterFrom) ||
      (filterTo !== null && entry.date > filterTo);
    if (hiddenByPeriod || hiddenByRange) {
      handleResetFilters();
      setToast("Entry added — showing all entries");
    } else {
      setToast("Entry added successfully");
    }
  }

  function handleRemove(id: string) {
    if (!email) return;
    setEntries(removeEntry(email, id));
  }

  function handleUpdate(entry: IncomeEntry) {
    if (!email) return;
    setEntries(updateEntry(email, entry));
  }

  function handleLogOut() {
    logOut();
    router.push("/");
  }

  if (!email) {
    return null;
  }

  const availableYears = yearsInEntries(entries);
  const hasDateRange = filterFrom !== null || filterTo !== null;
  const filteredEntries = hasDateRange
    ? filterEntriesByRange(entries, filterFrom, filterTo)
    : filterEntriesByPeriod(entries, filterYear, filterMonth);
  const summary = summarize(filteredEntries);

  function handleYearChange(year: number | null) {
    setFilterYear(year);
    setFilterFrom(null);
    setFilterTo(null);
  }

  function handleMonthChange(month: number | null) {
    setFilterMonth(month);
    setFilterFrom(null);
    setFilterTo(null);
  }

  function handleRangeApply(from: string | null, to: string | null) {
    setFilterFrom(from);
    setFilterTo(to);
    setFilterYear(null);
    setFilterMonth(null);
  }

  function handleResetFilters() {
    setFilterYear(null);
    setFilterMonth(null);
    setFilterFrom(null);
    setFilterTo(null);
  }

  const hasActiveFilter = filterYear !== null || filterMonth !== null || hasDateRange;
  const initial = email.charAt(0).toUpperCase();
  const feePct = summary.totalGrossInr > 0
    ? Math.round((summary.totalFeesInr / summary.totalGrossInr) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f6f6f4]">
      {toast && <Toast message={toast} />}
      <nav className="sticky top-0 z-10 bg-[#f6f6f4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
              IR
            </div>
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">
              Income Reconciler
            </span>
          </div>

          <span className="ml-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white">
            Overview
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm shadow-slate-200/50 hover:text-slate-900"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm shadow-slate-200/50 hover:text-slate-900"
              aria-label="Notifications"
            >
              <BellIcon />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initial}
            </div>
            <button
              type="button"
              onClick={handleLogOut}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm shadow-slate-200/50 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main id="overview" className="mx-auto max-w-7xl space-y-4 px-4 pb-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter
            years={availableYears}
            year={filterYear}
            month={filterMonth}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
          />
          <span className="text-xs text-slate-300">or</span>
          <DateRangePicker from={filterFrom} to={filterTo} onApply={handleRangeApply} />
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-red-200 hover:text-red-600"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
              Reset filters
            </button>
          )}
        </div>

        {/* Row 1: stacked stats · trend chart · income mix */}
        <section id="trend" className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <StatCard label="Gross income" value={formatInr(summary.totalGrossInr)} hint="Before fees" />
            <StatCard
              label="Platform fees"
              value={formatInr(summary.totalFeesInr)}
              badge={`${feePct}%`}
              badgeTone="warning"
              hint="Upwork 10% · Fiverr 20%"
            />
          </div>
          <div className="lg:col-span-2">
            <IncomeTrendChart data={netIncomeTrend(filteredEntries)} />
          </div>
          <div className="lg:col-span-1">
            <PlatformDonutChart data={groupByPlatform(filteredEntries)} />
          </div>
        </section>

        {/* Row 2: recent activity · safe-to-spend hero */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentEntriesList entries={summary.entries} />
          </div>
          <SafeToSpendCard
            safeToSpendInr={summary.safeToSpendInr}
            taxSetAsideInr={summary.taxSetAsideInr}
          />
        </section>

        {/* Row 3: all entries — table + collapsible add-entry form, one card */}
        <section
          id="entries"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-slate-700">All entries</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {filteredEntries.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              aria-expanded={addOpen}
              aria-controls="add-entry-form"
              className="flex items-center gap-1.5 rounded-full bg-teal-700 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800"
            >
              <PlusIcon open={addOpen} />
              {addOpen ? "Close" : "Add entry"}
            </button>
          </div>

          <div
            id="add-entry-form"
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              addOpen ? "mb-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
                <p className="mb-3 text-xs font-medium text-teal-800">
                  New income entry — fill this in and it&apos;ll appear in the table below.
                </p>
                <EntryForm onAdd={handleAdd} />
              </div>
            </div>
          </div>

          <EntryTable entries={summary.entries} onRemove={handleRemove} onUpdate={handleUpdate} />
        </section>
      </main>
    </div>
  );
}
