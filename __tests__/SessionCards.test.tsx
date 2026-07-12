import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionCards from "@/components/sessions/SessionCards";

describe("SessionCards", () => {
  it("renders all 4 session titles", () => {
    render(<SessionCards />);
    expect(screen.getByText(/What AI Can and Can't Do/i)).toBeInTheDocument();
    expect(screen.getByText(/Our School's Expectations/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Is Not a Friend/i)).toBeInTheDocument();
    expect(screen.getByText(/Family Segment/i)).toBeInTheDocument();
  });

  it("clicking a session reveals its core experience text", () => {
    render(<SessionCards />);
    fireEvent.click(screen.getByText(/What AI Can and Can't Do/i));
    expect(screen.getByText(/prompt an AI to actively hunt/i)).toBeInTheDocument();
  });

  it("clicking the same session again collapses it", () => {
    render(<SessionCards />);
    fireEvent.click(screen.getByText(/What AI Can and Can't Do/i));
    fireEvent.click(screen.getByText(/What AI Can and Can't Do/i));
    expect(screen.queryByText(/prompt an AI to actively hunt/i)).not.toBeInTheDocument();
  });
});
