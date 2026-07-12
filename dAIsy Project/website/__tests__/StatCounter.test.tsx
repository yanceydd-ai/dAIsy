import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCounter from "@/components/stats/StatCounter";

describe("StatCounter", () => {
  it("renders the label", () => {
    render(<StatCounter value={54} suffix="%" label="of students use AI" source="RAND 2025" />);
    expect(screen.getByText(/of students use AI/i)).toBeInTheDocument();
  });

  it("renders the source", () => {
    render(<StatCounter value={54} suffix="%" label="of students use AI" source="RAND 2025" />);
    expect(screen.getByText(/RAND 2025/i)).toBeInTheDocument();
  });

  it("renders the suffix", () => {
    render(<StatCounter value={54} suffix="%" label="of students use AI" source="RAND 2025" />);
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });
});
