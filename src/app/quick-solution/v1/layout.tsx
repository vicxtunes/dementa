import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Source_Serif_4, IBM_Plex_Sans } from "next/font/google";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Industrial Processes — 8 Day Sprint",
  description: "Senior Two Chemistry revision: 11 industrial processes over an 8-day sprint.",
};

// Scopes --font-sans/--font-serif to Plex Sans/Source Serif for this subtree
// only, so the rest of the app (the chat UI) keeps its own Geist fonts —
// both are read through the same `font-sans`/`font-serif` utility classes,
// which resolve to whichever value is closest in the DOM tree.
const scopedFontVars = {
  "--font-sans": "var(--font-plex-sans)",
  "--font-serif": "var(--font-source-serif)",
} as CSSProperties;

export default function QuickSolutionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${sourceSerif.variable} ${plexSans.variable} flex min-h-dvh flex-1 flex-col bg-paper font-sans text-ink antialiased`}
      style={scopedFontVars}
    >
      {children}
    </div>
  );
}
