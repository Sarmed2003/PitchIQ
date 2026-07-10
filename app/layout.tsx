import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { MotionProvider } from "@/components/providers/motion-provider";

// Inter for body text and Inter Tight for display. Both are open-licensed
// SF-inspired typefaces, so non-Apple devices get the same look macOS / iOS
// already give us through the system stack.
const interSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const interDisplay = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: {
    default: "PitchIQ — Fantasy football, redrawn.",
    template: "%s · PitchIQ",
  },
  description:
    "Live drafts, broadcast-grade lineups, and a luxury fantasy Premier League workspace built for serious managers.",
  applicationName: "PitchIQ",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PitchIQ",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${interSans.variable} ${interDisplay.variable}`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:font-medium focus:text-[var(--color-pitch)] focus:shadow-lg"
        >
          Skip to main content
        </a>
        <MotionProvider>
          <PostHogProvider>
            <QueryProvider>
              <TooltipProvider>
                <div id="main-content" tabIndex={-1} className="contents">
                  {children}
                </div>
              </TooltipProvider>
            </QueryProvider>
          </PostHogProvider>
        </MotionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
