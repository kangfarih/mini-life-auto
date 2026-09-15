import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mini-life-auto",
  description: "Self-growing 2D RPG world viewer"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
