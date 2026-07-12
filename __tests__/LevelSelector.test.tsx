import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LevelSelector from "@/components/use-scale/LevelSelector";

describe("LevelSelector", () => {
  it("renders buttons for levels 0 through 4", () => {
    render(<LevelSelector selectedLevel={0} onSelect={vi.fn()} />);
    for (let i = 0; i <= 4; i++) {
      expect(screen.getByRole("button", { name: new RegExp(`Level ${i}`, "i") })).toBeInTheDocument();
    }
  });

  it("calls onSelect with the correct level number when a level is clicked", () => {
    const onSelect = vi.fn();
    render(<LevelSelector selectedLevel={0} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Level 3/i }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("marks the selected level as aria-pressed=true", () => {
    render(<LevelSelector selectedLevel={2} onSelect={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Level 2/i });
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });
});
