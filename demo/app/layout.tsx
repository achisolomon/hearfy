import type { Metadata } from "next";
import "./globals.css";
import { BRAND_NAME } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — hearing diagnostics, at home`,
  description: `${BRAND_NAME} patient demo — at-home hearing care`
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
