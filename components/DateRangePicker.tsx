"use client";

import { useEffect, useRef, useState } from "react";
import { addMonths, monthGrid, monthLabel } from "@/lib/calendar";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onApply: (from: string | null, to: string | null) => void;
}

function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DateRangePicker({ from, to, onApply }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<string | null>(from);
  const [draftTo, setDraftTo] = useState<string | null>(to);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openPicker() {
    setDraftFrom(from);
    setDraftTo(to);
    setOpen(true);
  }

  function handleDayClick(date: string) {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(date);
      setDraftTo(null);
      return;
    }
    if (date < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(date);
    } else {
      setDraftTo(date);
    }
  }

  function handleApply() {
    onApply(draftFrom, draftTo);
    setOpen(false);
  }

  function handleClear() {
    setDraftFrom(null);
    setDraftTo(null);
    onApply(null, null);
    setOpen(false);
  }

  const nextView = addMonths(viewYear, viewMonth, 1);

  function renderMonth(year: number, month: number) {
    const cells = monthGrid(year, month);
    return (
      <div className="w-64">
        <p className="mb-3 text-center text-sm font-semibold text-slate-900">
          {monthLabel(year, month)}
        </p>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 font-medium text-slate-400">
              {w}
            </span>
          ))}
          {cells.map((cell, i) => {
            if (!cell.date) return <span key={i} />;
            const isFrom = cell.date === draftFrom;
            const isTo = cell.date === draftTo;
            const inRange =
              draftFrom && draftTo && cell.date > draftFrom && cell.date < draftTo;
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => handleDayClick(cell.date!)}
                className={`relative h-8 w-8 justify-self-center rounded-full text-sm transition ${
                  isFrom || isTo
                    ? "bg-teal-600 font-semibold text-white"
                    : inRange
                      ? "bg-teal-50 text-teal-900"
                      : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const hasSelection = from !== null || to !== null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-slate-300"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
        {hasSelection ? (
          <span>
            {from ? formatShort(from) : "Any"} – {to ? formatShort(to) : "Any"}
          </span>
        ) : (
          <span className="text-slate-400">Date range</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/60">
          <div className="flex items-start gap-6">
            <button
              type="button"
              onClick={() => {
                const prev = addMonths(viewYear, viewMonth, -1);
                setViewYear(prev.year);
                setViewMonth(prev.month);
              }}
              aria-label="Previous month"
              className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              ‹
            </button>

            {renderMonth(viewYear, viewMonth)}
            {renderMonth(nextView.year, nextView.month)}

            <button
              type="button"
              onClick={() => {
                const next = addMonths(viewYear, viewMonth, 1);
                setViewYear(next.year);
                setViewMonth(next.month);
              }}
              aria-label="Next month"
              className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              ›
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!draftFrom}
              className="rounded-md bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
