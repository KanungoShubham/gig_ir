import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntryForm } from "./EntryForm";

describe("EntryForm", () => {
  it("submits a valid entry and clears description/amount", async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText(/description/i), "Blog article");
    await user.type(screen.getByLabelText(/amount/i), "150");
    await user.click(screen.getByRole("button", { name: /add entry/i }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      description: "Blog article",
      grossAmount: 150,
      platform: "upwork",
      currency: "INR",
    });
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
  });

  it("shows a validation error and does not submit when description is empty", async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText(/amount/i), "150");
    await user.click(screen.getByRole("button", { name: /add entry/i }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/description is required/i);
  });

  it("shows a validation error for a zero/negative amount", async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(<EntryForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText(/description/i), "Something");
    await user.type(screen.getByLabelText(/amount/i), "0");
    await user.click(screen.getByRole("button", { name: /add entry/i }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/greater than 0/i);
  });
});
