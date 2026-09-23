import type { Metadata, Viewport } from "next";
import { TopBar } from "@/components/AppChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahjong Trainer",
  description:
    "Learn to read every Singapore mahjong tile from memory — flashcard lessons, spaced repetition and a tile glossary.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="warm-glow flex min-h-full flex-col">
        <TopBar />
        <main className="flex w-full flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
