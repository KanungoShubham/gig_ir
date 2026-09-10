"use client";

import { useState } from "react";
import type { Currency, IncomeEntry, Platform, ReconciledEntry } from "@/lib/types";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const PLATFORM_LABELS: Record<string, string> = {
  upwork: "Upwork",
  fiverr: "Fiverr",
  direct: "Direct / UPI",
  other: "Other",
};

const PLATFORM_BADGE: Record<string, string> = {
  upwork: "bg-blue-50 text-blue-700",
  fiverr: "bg-orange-50 text-orange-700",
  direct: "bg-emerald-50 text-emerald-700",
  other: "bg-amber-50 text-amber-700",
};

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        PLATFORM_BADGE[platform] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {PLATFORM_LABELS[platform] ?? platform}
    </span>
  );
}

const editFieldClass =
  "w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

interface EntryTableProps {
  entries: ReconciledEntry[];
  onRemove: (id: string) => void;
  onUpdate: (entry: IncomeEntry) => void;
}

export function EntryTable({ entries, onRemove, onUpdate }: EntryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IncomeEntry | null>(null);

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No income entries yet. Add one below.
      </p>
    );
  }

  function startEdit(entry: ReconciledEntry) {
    setEditingId(entry.id);
    setDraft({
      id: entry.id,
      platform: entry.platform,
      description: entry.description,
      grossAmount: entry.grossAmount,
      currency: entry.currency,
      date: entry.date,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft) return;
    if (!draft.description.trim() || !Number.isFinite(draft.grossAmount) || draft.grossAmount <= 0) {
      return;
    }
    onUpdate({ ...draft, description: draft.description.trim() });
    setEditingId(null);
    setDraft(null);
  }

  return (
    <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-[1] bg-white">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-400">Description</th>
            <th className="px-3 py-2 text-left font-medium text-slate-400">Date</th>
            <th className="px-3 py-2 text-left font-medium text-slate-400">Currency</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Gross</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Fee</th>
            <th className="px-3 py-2 text-right font-medium text-slate-400">Net</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {entries.map((entry) => {
            const isEditing = editingId === entry.id;

            if (isEditing && draft) {
              return (
                <tr key={entry.id} className="bg-teal-50/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        className={editFieldClass}
                        aria-label="Edit description"
                      />
                      <select
                        value={draft.platform}
                        onChange={(e) => setDraft({ ...draft, platform: e.target.value as Platform })}
                        className={editFieldClass}
                        aria-label="Edit platform"
                      >
                        <option value="upwork">Upwork</option>
                        <option value="fiverr">Fiverr</option>
                        <option value="direct">Direct / UPI</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                      className={editFieldClass}
                      aria-label="Edit date"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={draft.currency}
                      onChange={(e) => setDraft({ ...draft, currency: e.target.value as Currency })}
                      className={editFieldClass}
                      aria-label="Edit currency"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.grossAmount}
                      onChange={(e) => setDraft({ ...draft, grossAmount: Number(e.target.value) })}
                      className={editFieldClass}
                      aria-label="Edit amount"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">—</td>
                  <td className="px-3 py-2 text-right text-slate-400">—</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="mr-2 text-xs font-medium text-teal-700 hover:text-teal-900"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs font-medium text-slate-400 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={entry.id} className="transition hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{entry.description}</p>
                    <PlatformBadge platform={entry.platform} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-500">{entry.date}</td>
                <td className="px-3 py-2.5 text-slate-500">{entry.currency}</td>
                <td className="px-3 py-2.5 text-right text-slate-600">
                  {formatInr(entry.grossAmountInr)}
                </td>
                <td className="px-3 py-2.5 text-right text-amber-600">
                  {formatInr(entry.feeAmountInr)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                  {formatInr(entry.netAmountInr)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    aria-label={`Edit entry: ${entry.description}`}
                    className="mr-3 text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    aria-label={`Remove entry: ${entry.description}`}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
