import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { PostHogProvider } from "@/components/providers/posthog-provider";

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
    { media: "(prefers-color-scheme: dark)", color: "#060a13" },
    { media: "(prefers-color-scheme: light)", color: "#060a13" },
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
        <PostHogProvider>
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryProvider>
        </PostHogProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
