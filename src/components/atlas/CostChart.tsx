import { useAdvisor } from "@/lib/advisor";
import { formatCr } from "@/lib/score";
import { SourceTags } from "./SourceTag";

export function CostChart() {
  const { ranked, hoverCity, setHoverCity } = useAdvisor();
  const max = Math.max(...ranked.map((r) => r.costCr));
  return (
    <figure className="flex flex-col rounded-[14px] border bg-card p-4">
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[17px]">Estimated yearly cost <SourceTags codes={["F1", "R1"]} /></h3>
        <span className="flex gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-steel" />Payroll</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-brand" />Office</span>
        </span>
      </figcaption>
      <p className="sr-only">
        {ranked.map((r) => `${r.city.name}: payroll ${formatCr(r.payrollCr)}, office ${formatCr(r.officeCr)}, total ${formatCr(r.costCr)}.`).join(" ")}
      </p>
      <div
        className="relative flex flex-1 flex-col justify-around gap-3"
        aria-hidden
        style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--sunken) 0 1px, transparent 1px 20%)", backgroundPosition: "96px 0", backgroundRepeat: "no-repeat", backgroundSize: "calc(100% - 160px) 100%" }}
      >
        {ranked.map((r, k) => (
          <div
            key={r.city.id}
            className={`flex items-center gap-2 rounded-[10px] px-1 py-1 transition-colors duration-150 ${hoverCity === r.city.id ? "bg-sunken" : ""}`}
            onMouseEnter={() => setHoverCity(r.city.id)}
            onMouseLeave={() => setHoverCity(null)}
          >
            <span className="w-[88px] shrink-0 text-[13px]">{r.city.name}</span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                key={`${r.city.id}-${r.costCr.toFixed(2)}`}
                className="bar-grow flex h-5 overflow-hidden rounded-[4px]"
                style={{ width: `${(r.costCr / max) * 100}%`, animationDelay: `${k * 40}ms` }}
              >
                <div className="h-full bg-steel" style={{ width: `${(r.payrollCr / r.costCr) * 100}%` }} />
                <div className="h-full flex-1 bg-brand" />
              </div>
              <span className="num shrink-0 text-[12px]">{formatCr(r.costCr)}</span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
