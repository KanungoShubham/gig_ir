import { addMonths, monthGrid, monthLabel } from "./calendar";

describe("monthGrid", () => {
  it("pads the start of the month to align with the correct weekday", () => {
    // January 2024 starts on a Monday, so one Sunday padding cell before it.
    const grid = monthGrid(2024, 1);
    expect(grid[0]).toEqual({ date: null, day: null });
    expect(grid[1]).toEqual({ date: "2024-01-01", day: 1 });
  });

  it("includes every day of the month with correct ISO dates", () => {
    const grid = monthGrid(2024, 2); // leap year February = 29 days
    const dates = grid.filter((c) => c.date !== null).map((c) => c.date);
    expect(dates).toHaveLength(29);
    expect(dates[0]).toBe("2024-02-01");
    expect(dates[dates.length - 1]).toBe("2024-02-29");
  });

  it("handles a non-leap-year February correctly", () => {
    const grid = monthGrid(2025, 2);
    const dates = grid.filter((c) => c.date !== null);
    expect(dates).toHaveLength(28);
  });

  it("starts the grid on Sunday when the month begins on Sunday", () => {
    // June 2025 starts on a Sunday.
    const grid = monthGrid(2025, 6);
    expect(grid[0]).toEqual({ date: "2025-06-01", day: 1 });
  });
});

describe("addMonths", () => {
  it("advances within the same year", () => {
    expect(addMonths(2026, 3, 2)).toEqual({ year: 2026, month: 5 });
  });

  it("rolls over into the next year", () => {
    expect(addMonths(2026, 11, 2)).toEqual({ year: 2027, month: 1 });
  });

  it("rolls back into the previous year", () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("handles large negative offsets across multiple years", () => {
    expect(addMonths(2026, 1, -13)).toEqual({ year: 2024, month: 12 });
  });
});

describe("monthLabel", () => {
  it("formats a month and year", () => {
    expect(monthLabel(2026, 1)).toBe("January 2026");
    expect(monthLabel(2026, 12)).toBe("December 2026");
  });
});
