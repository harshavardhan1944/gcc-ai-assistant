import { ArrowDownRight, ShieldCheck } from "lucide-react";
import { useAdvisor } from "@/lib/advisor";
import { formatCr } from "@/lib/score";
import { SourceTag, SourceTags } from "./SourceTag";
import { StatusPill } from "./StatusPill";

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth={7} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent-c)"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 300ms ease-out" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="num" fontSize={size / 3.4} fill="var(--foreground)">
        {score}
      </text>
    </svg>
  );
}

export function Hero() {
  const { ranked, setCompare, setFlexOpen, ready } = useAdvisor();
  const [a, b] = ranked;
  if (!ready) return <div className="shimmer h-[300px] rounded-[14px]" />;
  const delta = b.costCr - a.costCr;

  return (
    <section className="raised overflow-hidden rounded-[14px] border bg-card" aria-labelledby="hero-city">
      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
        <div className="contour-bg flex items-center justify-between gap-4 p-6">
          <div>
            <p className="eyebrow text-brand">Recommended for you</p>
            <h2 id="hero-city" className="mt-2 text-[44px] leading-none">{a.city.name}</h2>
            <p className="mt-2 text-muted-foreground">{a.city.state}</p>
          </div>
          <ScoreRing score={a.score} />
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3 md:grid-cols-2 md:pl-0 xl:grid-cols-3">
          <Stat label="Total cost / yr" value={formatCr(a.costCr)} codes={["F1", "R1"]} />
          <Stat label="Payroll / yr" value={formatCr(a.payrollCr)} codes={["F1"]} />
          <Stat label="Talent pool" value={`${a.city.professionalsM}M`} codes={["F1"]} />
          <div className="sm:col-span-3 md:col-span-2 xl:col-span-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-good-bg px-3 py-1 text-[13px] text-good">
              <ArrowDownRight size={16} aria-hidden />
              {delta > 0.05
                ? `${formatCr(delta)} less than ${b.city.name} a year`
                : delta < -0.05
                  ? `${formatCr(-delta)} more than ${b.city.name} a year`
                  : `Same cost as ${b.city.name}`}
              <SourceTag code="F1" />
              <SourceTag code="R1" />
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t bg-background/40 px-6 py-3">
        <StatusPill tone={a.incentive.tone} label={a.incentive.label} />
        <SourceTags codes={a.city.incentive.sources} />
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <ShieldCheck size={18} aria-hidden /> {a.confidence.label}
        </span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setCompare([a.city.name, b.city.name])} className="rounded-full border px-4 py-2 text-[13px] font-medium hover:border-brand">
            Compare with {b.city.name}
          </button>
          <button onClick={() => setFlexOpen(true)} className="rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:opacity-90">
            Talk to Flexiple
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, codes }: { label: string; value: string; codes: ("F1" | "R1")[] }) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-1 flex flex-wrap items-center">
        <span className="num whitespace-nowrap text-[30px] leading-tight">{value}</span>
        <SourceTags codes={codes} />
      </p>
    </div>
  );
}
