import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/nav/NavBar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "dAIsy | Hockaday AI Student Program",
  description: "Hockaday's AI student program: AI Ambassadors, Junior AI Orchestrator certification, and the dAIsy Innovation Challenge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-primary antialiased">
        <NavBar />
        <main>{children}</main>
        <footer className="border-t border-primary/10 mt-24 py-12">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-primary/50">
            <span className="font-serif font-semibold text-primary">dAIsy</span>
            <span>Hockaday School · AI Student Program</span>
            <span>Literacy is the floor. Fluency is the standard.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
