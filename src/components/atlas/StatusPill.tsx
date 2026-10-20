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

interface StatusPillProps {
  tone: Tone;
  label: string;
  className?: string;
  onClick?: () => void;
  expanded?: boolean;
}

export function StatusPill({ tone, label, className, onClick, expanded }: StatusPillProps) {
  const Icon = icons[tone];
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
    tones[tone],
    onClick && "cursor-pointer transition-opacity hover:opacity-75",
    className,
  );
  if (!onClick) {
    return (
      <span className={cls}>
        <Icon size={14} aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} className={cls}>
      <Icon size={14} aria-hidden />
      {label}
    </button>
  );
}
