import { Minus, Plus, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useAdvisor } from "@/lib/advisor";
import { inputsSummary, type Inputs, type ParentStatus } from "@/lib/score";
import { cn } from "@/lib/utils";

function Stepper({ value, onChange, step, min, max, label }: { value: number; onChange: (v: number) => void; step: number; min: number; max: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - step))} className="rounded-[10px] border p-2 hover:bg-sunken"><Minus size={16} /></button>
      <input
        aria-label={label}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="num w-20 rounded-[10px] border bg-background px-2 py-2 text-center"
      />
      <button aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, value + step))} className="rounded-[10px] border p-2 hover:bg-sunken"><Plus size={16} /></button>
    </div>
  );
}

function SliderRow({ label, value, onChange, max = 5 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[13px]"><span>{label}</span><span className="num">{value}</span></div>
      <Slider aria-label={label} min={0} max={max} step={1} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function Chip({ label, flash, children }: { label: string; flash: boolean; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button key={flash ? label + "f" : label} className={cn("rounded-full border bg-card px-3 py-1.5 text-[13px] transition-colors duration-150 hover:border-brand", flash && "flash")}>
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 rounded-[14px]">{children}</PopoverContent>
    </Popover>
  );
}

export function AssumptionBar() {
  const { inputs, setInputs, flashKeys } = useAdvisor();
  const s = inputsSummary(inputs);
  const set = (p: Partial<Inputs>) => setInputs({ ...inputs, ...p });
  const setW = (p: Partial<Inputs["weights"]>) => setInputs({ ...inputs, weights: { ...inputs.weights, ...p } });

  const weights = (
    <>
      <p className="eyebrow text-muted-foreground">Weights (0–5)</p>
      <SliderRow label="Cost" value={inputs.weights.cost} onChange={(v) => setW({ cost: v })} />
      <SliderRow label="Talent" value={inputs.weights.talent} onChange={(v) => setW({ talent: v })} />
      <SliderRow label="Ecosystem" value={inputs.weights.ecosystem} onChange={(v) => setW({ ecosystem: v })} />
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Assumptions">
      <span className="eyebrow mr-1 text-muted-foreground">Assumptions</span>
      <Chip label={s.people} flash={flashKeys.includes("people")}>
        <p className="eyebrow text-muted-foreground">People in year one</p>
        <Stepper label="People" value={inputs.headcount} step={10} min={10} max={2000} onChange={(v) => set({ headcount: v })} />
      </Chip>
      <Chip label={s.senior} flash={flashKeys.includes("senior")}>
        <SliderRow label="Senior share (%)" max={100} value={Math.round(inputs.seniorShare * 100)} onChange={(v) => set({ seniorShare: v / 100 })} />
      </Chip>
      <Chip label={s.sqft} flash={flashKeys.includes("sqft")}>
        <p className="eyebrow text-muted-foreground">Sq ft per person</p>
        <Stepper label="Square feet per person" value={inputs.sqftPerPerson} step={10} min={40} max={300} onChange={(v) => set({ sqftPerPerson: v })} />
      </Chip>
      <Chip label={s.parent} flash={flashKeys.includes("parent")}>
        <p className="eyebrow text-muted-foreground">Parent in Forbes Global 2000 / Fortune 1000?</p>
        <div className="flex gap-2" role="radiogroup">
          {(["yes", "no", "unsure"] as ParentStatus[]).map((p) => (
            <button
              key={p}
              role="radio"
              aria-checked={inputs.parentGlobal2000 === p}
              onClick={() => set({ parentGlobal2000: p })}
              className={cn("flex-1 rounded-[10px] border px-2 py-2 text-[13px]", inputs.parentGlobal2000 === p && "border-brand bg-brand-soft")}
            >
              {p === "yes" ? "Yes" : p === "no" ? "No" : "Not sure"}
            </button>
          ))}
        </div>
      </Chip>
      <Chip label={s.weights} flash={flashKeys.includes("weights")}>{weights}</Chip>
      <Popover>
        <PopoverTrigger asChild>
          <button className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium hover:border-brand">
            <SlidersHorizontal size={16} aria-hidden /> Adjust
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-4 rounded-[14px]">
          <div>
            <p className="eyebrow mb-2 text-muted-foreground">People</p>
            <Stepper label="People" value={inputs.headcount} step={10} min={10} max={2000} onChange={(v) => set({ headcount: v })} />
          </div>
          <SliderRow label="Senior share (%)" max={100} value={Math.round(inputs.seniorShare * 100)} onChange={(v) => set({ seniorShare: v / 100 })} />
          {weights}
        </PopoverContent>
      </Popover>
    </div>
  );
}
