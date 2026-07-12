import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RiskTierMap from "@/components/risk-tier/RiskTierMap";

describe("RiskTierMap", () => {
  it("renders all four tier names", () => {
    render(<RiskTierMap />);
    expect(screen.getByText("Prohibited")).toBeInTheDocument();
    expect(screen.getByText("Governed")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Educator Caution")).toBeInTheDocument();
  });

  it("clicking Prohibited tier reveals its categories", () => {
    render(<RiskTierMap />);
    fireEvent.click(screen.getByText("Prohibited"));
    expect(screen.getByText(/Companion \/ roleplay chatbots/i)).toBeInTheDocument();
  });

  it("clicking Prohibited again collapses it", () => {
    render(<RiskTierMap />);
    fireEvent.click(screen.getByText("Prohibited"));
    fireEvent.click(screen.getByText("Prohibited"));
    expect(screen.queryByText(/Companion \/ roleplay chatbots/i)).not.toBeInTheDocument();
  });
});
