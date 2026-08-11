import type { Metadata } from "next";
import { Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const terminalFont = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-terminal",
});

export const metadata: Metadata = {
  title: "SITREP — Mapa de Conflitos ao Vivo",
  description: "Mapa e feed de notícias de conflitos em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={terminalFont.variable}>
      <body>{children}</body>
    </html>
  );
}
