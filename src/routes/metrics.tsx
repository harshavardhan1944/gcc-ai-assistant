import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { getMetrics } from "@/lib/gcc.functions";
import { Logo, ThemeToggle } from "@/components/atlas/TopBar";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Metrics · GCC Atlas" },
      { name: "description", content: "Usage metrics for GCC Location Advisor." },
      { property: "og:title", content: "Metrics · GCC Atlas" },
      { property: "og:description", content: "Usage metrics for GCC Location Advisor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Metrics,
});

function Spark({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, k) => `${(k / (data.length - 1)) * 120},${32 - (v / max) * 28}`).join(" ");
  return (
    <svg width={120} height={34} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent-c)" strokeWidth={2} />
    </svg>
  );
}

function Metrics() {
  const { data, isLoading, error } = useQuery({ queryKey: ["metrics"], queryFn: () => getMetrics() });
  return (
    <div className="min-h-screen">
      <header className="h-16 border-b bg-card">
        <div className="mx-auto flex h-full max-w-[1360px] items-center justify-between px-4 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-[30px]">Metrics</h1>
        {isLoading && <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((k) => <div key={k} className="shimmer h-28 rounded-[14px]" />)}</div>}
        {error && <p className="rounded-[10px] bg-bad-bg p-4 text-bad">Metrics couldn't load. Refresh the page to try again.</p>}
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Conversations started", String(data.conversations), data.series.conversations],
                ["Avg turns per conversation", data.avgTurns.toFixed(1), data.series.turns],
                ["Turns that changed inputs", `${data.pctChanged.toFixed(0)}%`, data.series.changed],
                ["Conversations ending in a lead", `${data.pctLead.toFixed(0)}%`, data.series.leads],
              ].map(([l, v, s]) => (
                <div key={l as string} className="rounded-[14px] border bg-card p-4">
                  <p className="eyebrow text-muted-foreground">{l as string}</p>
                  <p className="num mt-2 text-[30px]">{v as string}</p>
                  <Spark data={s as number[]} />
                </div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-[14px] border bg-card p-4">
                <h2 className="text-[22px]">Most common top cities</h2>
                <ul className="mt-4 space-y-2">
                  {data.topCities.map((c) => {
                    const max = data.topCities[0].count;
                    return (
                      <li key={c.name} className="flex items-center gap-3 text-[13px]">
                        <span className="w-24">{c.name}</span>
                        <div className="h-4 rounded bg-steel" style={{ width: `${(c.count / max) * 70}%` }} />
                        <span className="num">{c.count}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section className="rounded-[14px] border bg-card p-4">
                <h2 className="text-[22px]">Out-of-scope topics</h2>
                {data.outOfScope.length === 0 ? (
                  <p className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground"><BarChart3 size={18} /> No out-of-scope questions yet.</p>
                ) : (
                  <ul className="mt-4 space-y-1 text-[13px]">
                    {data.outOfScope.map((o) => <li key={o.topic} className="flex justify-between"><span>{o.topic}</span><span className="num">{o.count}</span></li>)}
                  </ul>
                )}
              </section>
            </div>
            <section className="rounded-[14px] border bg-card p-4">
              <h2 className="text-[22px]">Recent questions</h2>
              <table className="mt-4 w-full text-[13px]">
                <tbody>
                  {data.recent.map((r, k) => (
                    <tr key={k} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.question}</td>
                      <td className="py-2"><span className="rounded-full bg-steel-soft px-2 py-0.5 text-[12px] text-steel">{r.intent}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
