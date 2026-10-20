import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useAdvisor } from "@/lib/advisor";
import { formatCr, type RankedCity, conflictingFacts, incentiveExplanation } from "@/lib/score";
import type { Fact } from "@/data/cities";
import { SourceTag, SourceTags } from "./SourceTag";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

const SEG = { cost: "bg-brand", talent: "bg-steel", ecosystem: "bg-good" };

export function ScoreBar({ r }: { r: RankedCity }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2.5 w-full max-w-[200px] overflow-hidden rounded-full bg-sunken" role="img" aria-label={`Score ${r.score}: cost ${r.breakdown.cost.toFixed(0)}, talent ${r.breakdown.talent.toFixed(0)}, ecosystem ${r.breakdown.ecosystem.toFixed(0)}`}>
        <div className={SEG.cost} style={{ width: `${r.breakdown.cost}%` }} />
        <div className={SEG.talent} style={{ width: `${r.breakdown.talent}%` }} />
        <div className={SEG.ecosystem} style={{ width: `${r.breakdown.ecosystem}%` }} />
      </div>
      <span className="num text-[17px]">{r.score}</span>
    </div>
  );
}

function FactRow({ label, fact }: { label: string; fact: Fact }) {
  return (
    <div className="border-b py-2 last:border-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="text-[13px]">
        {fact ? (
          <>
            {fact.conflict && (
              <span className="mr-1 inline-flex items-center gap-1 font-semibold text-warn"><AlertTriangle size={14} aria-hidden />conflict:</span>
            )}
            {fact.text}
            <SourceTags codes={fact.sources} />
          </>
        ) : (
          <span className="text-muted-foreground">No verified data yet</span>
        )}
      </dd>
    </div>
  );
}

function Row({ r }: { r: RankedCity }) {
  const [open, setOpen] = useState(false);
  const [explain, setExplain] = useState<"conflict" | "incentive" | null>(null);
  const { hoverCity, setHoverCity, inputs } = useAdvisor();
  const c = r.city;
  const conflicts = conflictingFacts(c);
  return (
    <li
      onMouseEnter={() => setHoverCity(c.id)}
      onMouseLeave={() => setHoverCity(null)}
      className={cn(
        "border-b py-4 pl-4 pr-2 transition-colors duration-150 last:border-0",
        r.rank === 1 && "border-l-[3px] border-l-brand",
        hoverCity === c.id && "bg-background/60",
      )}
    >
      <div className="grid items-center gap-x-6 gap-y-3 md:grid-cols-[32px_1.2fr_1fr_1.6fr]">
        <span className="num text-[17px] text-muted-foreground">{String(r.rank).padStart(2, "0")}</span>
        <div>
          <h3 className="text-[22px] leading-tight">{c.name}</h3>
          <p className="text-[13px] text-muted-foreground">{c.state}</p>
        </div>
        <ScoreBar r={r} />
        <dl className="grid grid-cols-3 gap-3 text-[13px]">
          <div><dt className="text-[12px] text-muted-foreground">Payroll</dt><dd className="num">{formatCr(r.payrollCr)}<SourceTag code="F1" /></dd></div>
          <div><dt className="text-[12px] text-muted-foreground">Office</dt><dd className="num">{formatCr(r.officeCr)}<SourceTag code="R1" /></dd></div>
          <div><dt className="text-[12px] text-muted-foreground">Talent</dt><dd className="num">{c.professionalsM}M<SourceTag code="F1" /></dd></div>
        </dl>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 md:pl-[56px]">
        <StatusPill
          tone={r.incentive.tone}
          label={r.incentive.label}
          expanded={explain === "incentive"}
          onClick={() => setExplain((e) => (e === "incentive" ? null : "incentive"))}
        />
        {conflicts.length > 0 && (
          <StatusPill
            tone="warning"
            label="Sources disagree"
            expanded={explain === "conflict"}
            onClick={() => setExplain((e) => (e === "conflict" ? null : "conflict"))}
          />
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-steel hover:underline"
        >
          Data behind {c.name}
          <ChevronDown size={16} className={cn("transition-transform duration-150", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {explain === "conflict" && (
        <div className="mt-2 rounded-[10px] bg-warn-bg px-4 py-3 text-[13px] md:ml-[56px]">
          <p className="font-medium text-warn">Why "Sources disagree"</p>
          <p className="mt-1 text-muted-foreground">
            Two of the reports we cite give different numbers for the same fact, so we show both instead of picking one:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {conflicts.map(({ label, fact }) => (
              <li key={label}>
                <span className="font-medium">{label}:</span> {fact?.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {explain === "incentive" && (
        <div className="mt-2 rounded-[10px] bg-sunken px-4 py-3 text-[13px] md:ml-[56px]">
          <p className="font-medium">About "{r.incentive.label}"</p>
          <p className="mt-1 text-muted-foreground">{incentiveExplanation(c, inputs)}</p>
        </div>
      )}
      {open && (
        <dl className="mt-3 grid gap-x-8 rounded-[10px] bg-sunken px-4 py-2 sm:grid-cols-2 md:ml-[56px]">
          <FactRow label="Software engineer median CTC" fact={{ text: `₹${c.seMedian} lakh`, sources: ["F1", "F2"] }} />
          <FactRow label="Senior (6+ yrs) median CTC" fact={{ text: `₹${c.seniorMedian} lakh`, sources: ["F1", "F2"] }} />
          <FactRow label="Average office rent (₹/sq ft/month)" fact={{ text: `₹${c.avgRent}`, sources: ["R1"] }} />
          <FactRow label="Prime office rent (₹/sq ft/month)" fact={c.primeRent} />
          <FactRow label="Professionals tracked" fact={{ text: `${c.professionalsM}M`, sources: ["F1"] }} />
          <FactRow label="Companies with 25+ people" fact={{ text: `${c.companies25}`, sources: ["F1"] }} />
          <FactRow label="GCC count" fact={c.gccCount} />
          <FactRow label="GCC share of office absorption, H1 2026" fact={c.gccShare} />
          <div className="sm:col-span-2"><FactRow label="Incentives" fact={c.incentive} /></div>
          <p className="py-2 text-[12px] text-muted-foreground sm:col-span-2">{r.confidence.label}</p>
        </dl>
      )}
    </li>
  );
}

export function CityList() {
  const { ranked } = useAdvisor();
  return (
    <section className="rounded-[14px] border bg-card" aria-labelledby="ranked-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 id="ranked-title" className="text-[22px]">All six cities, ranked</h2>
        <span className="flex gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand" />Cost</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-steel" />Talent</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-good" />Ecosystem</span>
        </span>
      </div>
      <ol>{ranked.map((r) => <Row key={r.city.id} r={r} />)}</ol>
    </section>
  );
}
