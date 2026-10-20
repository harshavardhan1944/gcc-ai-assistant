import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { Tone } from "@/lib/score";
import { cn } from "@/lib/utils";

const tones: Record<Tone, string> = {
  good: "bg-good-bg text-good",
  warning: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  neutral: "bg-sunken text-muted-foreground",
};
const icons = { good: CheckCircle2, warning: AlertTriangle, bad: XCircle, neutral: Info };

export function StatusPill({ tone, label, className }: { tone: Tone; label: string; className?: string }) {
  const Icon = icons[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", tones[tone], className)}>
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}
