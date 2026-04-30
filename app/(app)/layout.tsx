import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { LiveScoreBar } from "@/components/scoring/LiveScoreBar";
import { Assistant } from "@/components/assistant/Assistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh bg-[var(--color-pitch)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <LiveScoreBar />
        <main
          className="min-h-0 flex-1 px-3 pb-tabbar pt-3 sm:px-5 lg:px-8 lg:pb-8"
        >
          {children}
        </main>
        <MobileTabBar />
      </div>
      <Assistant />
    </div>
  );
}
