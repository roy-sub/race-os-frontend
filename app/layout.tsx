import type { Metadata } from "next";
import { BootLoader } from "@/components/BootLoader";
import { ScrollFx } from "@/components/ScrollFx";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaceOS — Race week, solved.",
  description: "Pacing, fuelling, five bags and every cut-off — solved against your real course.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <BootLoader />
        <ScrollFx />
        {children}
      </body>
    </html>
  );
}
