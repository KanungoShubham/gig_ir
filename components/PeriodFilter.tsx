const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PeriodFilterProps {
  years: number[];
  year: number | null;
  month: number | null;
  onYearChange: (year: number | null) => void;
  onMonthChange: (month: number | null) => void;
}

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

export function PeriodFilter({ years, year, month, onYearChange, onMonthChange }: PeriodFilterProps) {
  const hasFilter = year !== null || month !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-400">Filter</span>
      <select
        aria-label="Filter by year"
        value={year ?? "all"}
        onChange={(e) => onYearChange(e.target.value === "all" ? null : Number(e.target.value))}
        className={selectClass}
      >
        <option value="all">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by month"
        value={month ?? "all"}
        onChange={(e) => onMonthChange(e.target.value === "all" ? null : Number(e.target.value))}
        className={selectClass}
      >
        <option value="all">All months</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            onYearChange(null);
            onMonthChange(null);
          }}
          className="text-xs font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}
