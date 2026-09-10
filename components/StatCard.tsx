export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  badge?: string;
  badgeTone?: "neutral" | "warning" | "positive";
}

export function StatCard({ label, value, hint, badge, badgeTone = "neutral" }: StatCardProps) {
  const badgeClass =
    badgeTone === "positive"
      ? "bg-teal-50 text-teal-700"
      : badgeTone === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-[28px] font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
