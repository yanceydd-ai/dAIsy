import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock framer-motion — prevents animation side-effects in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
        <div {...props}>{children}</div>,
      section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
        <section {...props}>{children}</section>,
      button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
        <button {...props}>{children}</button>,
      svg: ({ children, ...props }: React.SVGAttributes<SVGElement>) =>
        <svg {...props}>{children}</svg>,
      circle: (props: React.SVGAttributes<SVGCircleElement>) => <circle {...props} />,
      path: (props: React.SVGAttributes<SVGPathElement>) => <path {...props} />,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInView: () => true,
  };
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
