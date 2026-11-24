import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SalesSlide } from "@/components/sales/slide";
import { SLIDES } from "@/lib/sales";
import "@/components/sales/sales.css";

/**
 * The public sales deck as a page: a sibling of the one-pager, not part of the
 * demo walkthrough, so it has no demo chrome. Copy lives in `lib/sales.ts`.
 * Static server component; no script runs, so every slide is visible at rest.
 */
export const metadata: Metadata = {
  title: "Concierge hearing",
  robots: { index: false, follow: false },
};

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Inter({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-inter", display: "swap" });

export default function SalesPage() {
  return (
    <main className={`sales ${serif.variable} ${sans.variable}`}>
      {SLIDES.map((slide) => (
        <SalesSlide key={slide.id} slide={slide} />
      ))}
    </main>
  );
}
