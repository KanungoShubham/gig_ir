import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntryTable } from "./EntryTable";
import { reconcileEntry } from "@/lib/reconciliation";
import type { IncomeEntry } from "@/lib/types";

function entry(overrides: Partial<IncomeEntry> = {}): IncomeEntry {
  return {
    id: "1",
    platform: "upwork",
    description: "Website project",
    grossAmount: 1000,
    currency: "INR",
    date: "2026-08-01",
    ...overrides,
  };
}

describe("EntryTable", () => {
  it("renders an empty state with no entries", () => {
    render(<EntryTable entries={[]} onRemove={jest.fn()} onUpdate={jest.fn()} />);
    expect(screen.getByText(/no income entries yet/i)).toBeInTheDocument();
  });

  it("calls onRemove with the entry id", async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    const reconciled = [reconcileEntry(entry())];
    render(<EntryTable entries={reconciled} onRemove={onRemove} onUpdate={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: /remove entry/i }));
    expect(onRemove).toHaveBeenCalledWith("1");
  });

  it("edits an entry and saves the change", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    const reconciled = [reconcileEntry(entry())];
    render(<EntryTable entries={reconciled} onRemove={jest.fn()} onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: /edit entry/i }));
    const descriptionInput = screen.getByLabelText(/edit description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated description");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toMatchObject({
      id: "1",
      description: "Updated description",
    });
  });

  it("cancels an edit without calling onUpdate", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    const reconciled = [reconcileEntry(entry())];
    render(<EntryTable entries={reconciled} onRemove={jest.fn()} onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: /edit entry/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("Website project")).toBeInTheDocument();
  });

  it("does not save an edit with an empty description", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    const reconciled = [reconcileEntry(entry())];
    render(<EntryTable entries={reconciled} onRemove={jest.fn()} onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: /edit entry/i }));
    const descriptionInput = screen.getByLabelText(/edit description/i);
    await user.clear(descriptionInput);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
