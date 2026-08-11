import type { Metadata } from "next";
import { Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const terminalFont = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
});

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
    <html lang="en" className={terminalFont.variable}>
      <body>{children}</body>
    </html>
  );
}
