import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SITREP — Live Conflict Map",
  description: "Real-time conflict tracking map and news feed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
