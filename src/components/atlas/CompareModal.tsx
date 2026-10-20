import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdvisor } from "@/lib/advisor";
import { CITIES, type SourceCode } from "@/data/cities";
import { formatCr, type RankedCity } from "@/lib/score";
import { SourceTags } from "./SourceTag";

type Metric = { label: string; get: (r: RankedCity) => number | null; fmt: (v: number) => string; better: "low" | "high" | null; codes: SourceCode[]; text?: (r: RankedCity) => string };

const METRICS: Metric[] = [
  { label: "Score", get: (r) => r.score, fmt: String, better: "high", codes: ["F1", "R1"] },
  { label: "Total cost / yr", get: (r) => r.costCr, fmt: formatCr, better: "low", codes: ["F1", "R1"] },
  { label: "Payroll / yr", get: (r) => r.payrollCr, fmt: formatCr, better: "low", codes: ["F1"] },
  { label: "Office / yr", get: (r) => r.officeCr, fmt: formatCr, better: "low", codes: ["R1"] },
  { label: "Professionals tracked", get: (r) => r.city.professionalsM, fmt: (v) => `${v}M`, better: "high", codes: ["F1"] },
  { label: "Companies with 25+ people", get: (r) => r.city.companies25, fmt: String, better: "high", codes: ["F1"] },
  { label: "Engineer median CTC", get: (r) => r.city.seMedian, fmt: (v) => `₹${v} L`, better: "low", codes: ["F1"] },
  { label: "Senior median CTC", get: (r) => r.city.seniorMedian, fmt: (v) => `₹${v} L`, better: "low", codes: ["F1"] },
  { label: "Average rent (₹/sq ft/mo)", get: (r) => r.city.avgRent, fmt: (v) => `₹${v}`, better: "low", codes: ["R1"] },
  { label: "Prime rent", get: () => null, fmt: String, better: null, codes: ["R2"], text: (r) => r.city.primeRent?.text ?? "No verified data yet" },
  { label: "GCC count", get: () => null, fmt: String, better: null, codes: ["R2"], text: (r) => r.city.gccCount?.text ?? "No verified data yet" },
  { label: "GCC share of absorption", get: () => null, fmt: String, better: null, codes: ["R3"], text: (r) => r.city.gccShare?.text ?? "No verified data yet" },
  { label: "Incentive status", get: () => null, fmt: String, better: null, codes: [], text: (r) => r.incentive.label },
];

export function CompareModal() {
  const { compare, setCompare, ranked } = useAdvisor();
  if (!compare) return null;
  const a = ranked.find((r) => r.city.name === compare[0]) ?? ranked[0];
  const b = ranked.find((r) => r.city.name === compare[1]) ?? ranked[1];
  const diff = a.costCr - b.costCr;

  const selector = (val: string, idx: 0 | 1) => (
    <select
      aria-label={`City ${idx + 1}`}
      value={val}
      onChange={(e) => {
        const n = [...compare] as [string, string];
        n[idx] = e.target.value;
        setCompare(n);
      }}
      className="w-full rounded-[10px] border bg-background px-3 py-2 font-serif text-[22px]"
    >
      {CITIES.map((c) => <option key={c.id}>{c.name}</option>)}
    </select>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && setCompare(null)}>
      <DialogContent className="max-h-[90vh] max-w-[880px] overflow-y-auto rounded-[14px] backdrop-blur sm:max-w-[880px]">
        <DialogTitle className="text-[22px]">Compare cities</DialogTitle>
        <DialogDescription className="sr-only">Side-by-side metrics for two cities</DialogDescription>
        <div className="grid grid-cols-2 gap-4">{selector(a.city.name, 0)}{selector(b.city.name, 1)}</div>
        <div className="rounded-[10px] bg-sunken p-4 text-center">
          <p className="eyebrow text-muted-foreground">Yearly cost difference</p>
          <p className="num mt-1 text-[30px]">{formatCr(Math.abs(diff))}<SourceTags codes={["F1", "R1"]} /></p>
          <p className="text-[13px] text-muted-foreground">
            {Math.abs(diff) < 0.05 ? "About the same" : `${diff < 0 ? a.city.name : b.city.name} is cheaper`}
          </p>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 font-medium">Metric</th>
              <th className="py-2 font-medium">{a.city.name}</th>
              <th className="py-2 font-medium">{b.city.name}</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const va = m.get(a);
              const vb = m.get(b);
              const win = va != null && vb != null && va !== vb && m.better ? ((m.better === "low" ? va < vb : va > vb) ? 0 : 1) : null;
              const cell = (r: RankedCity, v: number | null, i: 0 | 1) => (
                <td className="py-2 pr-2 align-top">
                  <span className={v != null ? "num" : ""}>{v != null ? m.fmt(v) : m.text?.(r)}</span>
                  {m.codes.length > 0 && <SourceTags codes={m.codes} />}
                  {win === i && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-[12px] font-semibold text-good"><Check size={14} aria-hidden />Better</span>
                  )}
                </td>
              );
              return (
                <tr key={m.label} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-2 text-left font-normal text-muted-foreground">{m.label}</th>
                  {cell(a, va, 0)}
                  {cell(b, vb, 1)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}
