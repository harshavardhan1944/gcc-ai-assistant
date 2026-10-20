import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useAdvisor } from "@/lib/advisor";
import { TaggedText } from "./SourceTag";

export function WhyCard() {
  const { explanation, refreshExplanation } = useAdvisor();
  const [copied, setCopied] = useState(false);
  return (
    <section className="rounded-[14px] border bg-card p-6" aria-labelledby="why-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="why-title" className="text-[22px]">Why this ranking</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(explanation.text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] hover:border-brand"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={refreshExplanation} disabled={explanation.loading} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] hover:border-brand disabled:opacity-50">
            <RefreshCw size={16} className={explanation.loading ? "animate-spin" : ""} /> Refresh explanation
          </button>
        </div>
      </div>
      {explanation.stale && !explanation.loading && (
        <p className="mt-3 rounded-[10px] bg-warn-bg px-3 py-2 text-[13px] text-warn">Assumptions changed since this was written. Refresh to update it.</p>
      )}
      {explanation.loading ? (
        <div className="mt-4 max-w-[68ch] space-y-2">
          <div className="shimmer h-4 rounded" /><div className="shimmer h-4 w-11/12 rounded" /><div className="shimmer h-4 w-2/3 rounded" />
        </div>
      ) : (
        <p className="mt-4 max-w-[68ch] text-[16px] leading-[1.65]"><TaggedText text={explanation.text} /></p>
      )}
      <p className="mt-3 text-[12px] text-muted-foreground">
        {explanation.ai ? "Generated from the figures above" : "AI is unavailable, so this is the tool's own summary."}
      </p>
    </section>
  );
}
