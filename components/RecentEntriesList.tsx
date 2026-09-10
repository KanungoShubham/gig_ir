import type { ReconciledEntry } from "@/lib/types";
import { formatInr } from "./StatCard";

const PLATFORM_COLOR: Record<string, string> = {
  upwork: "#2a78d6",
  fiverr: "#eb6834",
  direct: "#1baf7a",
  other: "#eda100",
};

const PLATFORM_LABEL: Record<string, string> = {
  upwork: "Upwork",
  fiverr: "Fiverr",
  direct: "Direct / UPI",
  other: "Other",
};

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RecentEntriesList({ entries }: { entries: ReconciledEntry[] }) {
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
        <h3 className="text-sm font-medium text-slate-700">Recent activity</h3>
        <p className="mt-6 text-center text-sm text-slate-400">No entries yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Recent activity</h3>
        <a href="#entries" className="text-xs font-medium text-slate-400 hover:text-slate-700">
          View all
        </a>
      </div>
      <ul className="divide-y divide-slate-100">
        {recent.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: PLATFORM_COLOR[entry.platform] ?? "#898781" }}
              aria-hidden
            >
              {PLATFORM_LABEL[entry.platform]?.charAt(0) ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{entry.description}</p>
              <p className="text-xs text-slate-400">
                {PLATFORM_LABEL[entry.platform]} · {formatDateShort(entry.date)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-900">
              {formatInr(entry.netAmountInr)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
