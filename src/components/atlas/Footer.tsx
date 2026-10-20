import { ExternalLink } from "lucide-react";
import { SOURCES } from "@/data/cities";

export function Footer() {
  return (
    <footer className="mt-10 bg-sunken">
      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="text-[22px]">How the score works</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed">
            <li>Payroll = people × (senior share × senior median pay + other share × engineer median pay).</li>
            <li>Office = people × sq ft each × average rent × 12 months.</li>
            <li>Yearly cost = payroll + office.</li>
            <li>Each city gets 0–1 on cost (cheapest = 1), talent (professionals tracked) and ecosystem (companies with 25+ people), relative to the other five.</li>
            <li>Score = weighted average of the three, times 100. Ties go to the cheaper city.</li>
          </ol>
        </div>
        <div>
          <h2 className="text-[22px]">Sources</h2>
          <ul className="mt-4 space-y-2 text-[13px]">
            {Object.entries(SOURCES).map(([k, s]) => (
              <li key={k} className="flex gap-3">
                <span className="num w-6 shrink-0 text-brand">{k}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 hover:underline">
                  {s.title} <ExternalLink size={14} className="mt-0.5 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-muted-foreground md:col-span-2">
          Prototype · Payroll and office costs are illustrative estimates, not quotes. Incentives are shown but not scored, because state terms are not yet comparable.
        </p>
      </div>
    </footer>
  );
}
