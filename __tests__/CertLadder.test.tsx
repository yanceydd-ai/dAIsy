import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CertLadder from "@/components/ladder/CertLadder";

describe("CertLadder", () => {
  it("renders Bronze, Silver, and Gold rungs", () => {
    render(<CertLadder />);
    expect(screen.getByText("Bronze")).toBeInTheDocument();
    expect(screen.getByText("Silver")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
  });

  it("clicking a rung reveals its demonstration requirements", () => {
    render(<CertLadder />);
    fireEvent.click(screen.getByText("Silver"));
    expect(screen.getByText(/Directing tools across real academic/i)).toBeInTheDocument();
  });

  it("clicking a rung again collapses it", () => {
    render(<CertLadder />);
    fireEvent.click(screen.getByText("Silver"));
    fireEvent.click(screen.getByText("Silver"));
    expect(screen.queryByText(/Directing tools across real academic/i)).not.toBeInTheDocument();
  });
});
