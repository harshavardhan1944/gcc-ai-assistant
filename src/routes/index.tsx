import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { AdvisorProvider, useAdvisor } from "@/lib/advisor";
import { TopBar } from "@/components/atlas/TopBar";
import { AssistantPanel } from "@/components/atlas/AssistantPanel";
import { AssumptionBar } from "@/components/atlas/AssumptionBar";
import { Hero } from "@/components/atlas/Hero";
import { IndiaMap } from "@/components/atlas/IndiaMap";
import { CostChart } from "@/components/atlas/CostChart";
import { CityList } from "@/components/atlas/CityList";
import { WhyCard } from "@/components/atlas/WhyCard";
import { Footer } from "@/components/atlas/Footer";
import { CompareModal } from "@/components/atlas/CompareModal";
import { FlexipleDrawer } from "@/components/atlas/FlexipleDrawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GCC Location Advisor · GCC Atlas" },
      { name: "description", content: "Compare six Indian cities for your first Global Capability Centre on cost, talent and incentives, with an AI assistant and sourced data." },
      { property: "og:title", content: "GCC Location Advisor · GCC Atlas" },
      { property: "og:description", content: "Rank Bengaluru, Hyderabad, Chennai, Pune, Mumbai and Delhi NCR for your India GCC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AdvisorProvider>
      <Shell />
    </AdvisorProvider>
  );
}

function Shell() {
  const { aiAvailable, bannerDismissed, dismissBanner } = useAdvisor();
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <TopBar />
      {!aiAvailable && !bannerDismissed && (
        <div role="status" className="flex items-center gap-2 bg-warn-bg px-4 py-2 text-[13px] text-warn">
          <TriangleAlert size={16} aria-hidden />
          <span className="flex-1">The AI assistant is unavailable. You can still change the assumptions and the ranking will update.</span>
          <button onClick={dismissBanner} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
      <div className="mx-auto flex max-w-[1360px] gap-6 px-4 sm:px-6">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[420px] shrink-0 border-x min-[1100px]:block">
          <AssistantPanel />
        </aside>
        <main className="min-w-0 flex-1 space-y-6 py-6">
          <AssumptionBar />
          <Hero />
          <div className="grid gap-6 lg:grid-cols-2">
            <IndiaMap />
            <CostChart />
          </div>
          <CityList />
          <WhyCard />
        </main>
      </div>
      <Footer />

      <button
        onClick={() => setChatOpen(true)}
        className="raised fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-primary-foreground min-[1100px]:hidden"
      >
        <MessageCircle size={18} aria-hidden /> Ask the assistant
      </button>
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className="w-full p-0 sm:max-w-[440px]">
          <SheetTitle className="sr-only">GCC assistant</SheetTitle>
          <AssistantPanel className="h-full" inputId="chat-input-sheet" />
        </SheetContent>
      </Sheet>
      <CompareModal />
      <FlexipleDrawer />
    </div>
  );
}
