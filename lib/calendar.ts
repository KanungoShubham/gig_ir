export interface CalendarCell {
  /** ISO "YYYY-MM-DD", or null for a padding cell outside the month. */
  date: string | null;
  day: number | null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Builds a Sunday-first calendar grid for a given month, as flat cells
 * (padding cells at the start/end have `date: null`). Pure date math —
 * no `Date` mutation, no timezone surprises from local-time `Date` objects.
 */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: null, day: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: `${year}-${pad2(month)}-${pad2(day)}`, day });
  }
  return cells;
}

/** Returns { year, month } for the month `offset` months after (year, month). 1-indexed month. */
export function addMonths(year: number, month: number, offset: number): { year: number; month: number } {
  const zeroBasedTotal = (month - 1) + offset;
  const newYear = year + Math.floor(zeroBasedTotal / 12);
  const newMonth = ((zeroBasedTotal % 12) + 12) % 12;
  return { year: newYear, month: newMonth + 1 };
}

export function monthLabel(year: number, month: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[month - 1]} ${year}`;
}
