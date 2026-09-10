import { formatInr } from "./StatCard";

export function SafeToSpendCard({
  safeToSpendInr,
  taxSetAsideInr,
}: {
  safeToSpendInr: number;
  taxSetAsideInr: number;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-b from-teal-200 to-white p-5 shadow-sm shadow-slate-200/50">
      <div>
        <h3 className="text-sm font-medium text-teal-900">Safe to spend</h3>
        <p className="mt-2 text-[28px] font-semibold tracking-tight text-teal-950">
          {formatInr(safeToSpendInr)}
        </p>
        <p className="mt-1 text-xs text-teal-800/70">
          After {formatInr(taxSetAsideInr)} set aside for tax
        </p>
      </div>
      <div className="mt-4 rounded-xl bg-white/60 p-3 text-xs text-teal-900">
        30% of net income is automatically reserved so you don&apos;t overspend
        before tax season.
      </div>
    </div>
  );
}
