import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HearMi — Hearing care, at home",
  description: "Patient MVP for at-home hearing care"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
