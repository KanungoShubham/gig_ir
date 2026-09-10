"use client";

import { useState } from "react";
import type { Currency, IncomeEntry, Platform } from "@/lib/types";

interface EntryFormProps {
  onAdd: (entry: IncomeEntry) => void;
}

const fieldClass =
  "mt-1 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export function EntryForm({ onAdd }: EntryFormProps) {
  const [platform, setPlatform] = useState<Platform>("upwork");
  const [description, setDescription] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(grossAmount);
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a gross amount greater than 0.");
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      platform,
      description: description.trim(),
      grossAmount: amount,
      currency,
      date,
    });

    setDescription("");
    setGrossAmount("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-[2] basis-40">
        <label htmlFor="description" className="block text-xs font-medium text-slate-500">
          Description
        </label>
        <input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Logo design"
          className={fieldClass}
        />
      </div>

      <div className="min-w-0 flex-1 basis-28">
        <label htmlFor="platform" className="block text-xs font-medium text-slate-500">
          Platform
        </label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className={fieldClass}
        >
          <option value="upwork">Upwork</option>
          <option value="fiverr">Fiverr</option>
          <option value="direct">Direct / UPI</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="min-w-0 flex-1 basis-24">
        <label htmlFor="grossAmount" className="block text-xs font-medium text-slate-500">
          Amount
        </label>
        <input
          id="grossAmount"
          type="number"
          min="0"
          step="0.01"
          value={grossAmount}
          onChange={(e) => setGrossAmount(e.target.value)}
          placeholder="0.00"
          className={fieldClass}
        />
      </div>

      <div className="min-w-0 flex-1 basis-20">
        <label htmlFor="currency" className="block text-xs font-medium text-slate-500">
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className={fieldClass}
        >
          <option value="INR">INR</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="min-w-0 flex-1 basis-32">
        <label htmlFor="date" className="block text-xs font-medium text-slate-500">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800"
      >
        Add entry
      </button>

      {error && (
        <p role="alert" className="basis-full text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
