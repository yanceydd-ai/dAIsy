"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DaisyLogo from "@/components/flower/DaisyLogo";
import { NAV_LINKS } from "@/lib/content";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-primary shrink-0" aria-label="dAIsy home">
          <DaisyLogo size={28} />
          <span className="text-lg">dAIsy</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-background"
                    : "text-primary/70 hover:text-primary hover:bg-primary/8",
                ].join(" ")}
                style={
                  isActive && link.pillarColor
                    ? { backgroundColor: link.pillarColor, color: "#1B4332" }
                    : {}
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
