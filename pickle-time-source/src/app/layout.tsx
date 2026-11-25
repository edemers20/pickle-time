import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PlayerSessionProvider } from "@/components/player-session";
import { PlayerSheetProvider } from "@/components/player-sheet";
import { TeamSheetProvider } from "@/components/team-sheet";
import { TourneyProvider } from "@/components/tourney-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Pickle Time",
  description: "Scores, standings, bracket and player cards for the pickleball tournament.",
  referrer: "same-origin",
};

export const viewport: Viewport = {
  themeColor: "#0d1424",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${dmSans.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TourneyProvider>
          <PlayerSessionProvider>
            <PlayerSheetProvider>
              <TeamSheetProvider>
                <AppShell>{children}</AppShell>
                <Toaster theme="dark" position="top-center" richColors />
              </TeamSheetProvider>
            </PlayerSheetProvider>
          </PlayerSessionProvider>
        </TourneyProvider>
      </body>
    </html>
  );
}
