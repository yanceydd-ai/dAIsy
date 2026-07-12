import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NavBar from "@/components/nav/NavBar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("NavBar", () => {
  it("renders all 7 navigation links", () => {
    render(<NavBar />);
    expect(screen.getByRole("link", { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Ambassadors/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Orchestrator/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Innovation Challenge/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI Use Scale/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Research/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Governance/i })).toBeInTheDocument();
  });

  it("renders the dAIsy logo link pointing to /", () => {
    render(<NavBar />);
    const logoLink = screen.getByRole("link", { name: /dAIsy/i });
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
