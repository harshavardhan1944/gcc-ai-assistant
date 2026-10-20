import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdvisor } from "@/lib/advisor";
import { inputsSummary } from "@/lib/score";
import { submitLead } from "@/lib/gcc.functions";

export function FlexipleDrawer() {
  const { flexOpen, setFlexOpen, inputs, ranked, conversationId } = useAdvisor();
  const [form, setForm] = useState({ name: "", email: "", company: "", teamSize: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const s = inputsSummary(inputs);

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <label htmlFor={`lead-${k}`} className="text-[13px] font-medium">{label}</label>
      <input
        id={`lead-${k}`}
        type={type}
        required={k !== "teamSize"}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="w-full rounded-[10px] border bg-background px-3 py-2.5 outline-none focus:border-brand"
      />
    </div>
  );

  return (
    <Sheet open={flexOpen} onOpenChange={(o) => { setFlexOpen(o); if (!o && state === "done") setState("idle"); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="font-serif text-[22px]">Plan your India centre with Flexiple</SheetTitle>
          <SheetDescription>We'll start from the plan you've built here.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-1 rounded-[10px] bg-sunken p-4 text-[13px]">
          <p><span className="text-muted-foreground">Top city:</span> <strong>{ranked[0].city.name}</strong> (score <span className="num">{ranked[0].score}</span>)</p>
          <p className="text-muted-foreground">{[s.people, s.senior, s.sqft, s.parent, s.weights].join(" · ")}</p>
        </div>
        {state === "done" ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 size={32} className="text-good" aria-hidden />
            <p className="text-[17px]">Thanks — the Flexiple GCC team will be in touch.</p>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setState("sending");
              try {
                await submitLead({ data: { ...form, conversationId, inputs } });
                setState("done");
                setForm({ name: "", email: "", company: "", teamSize: "" });
              } catch {
                setState("error");
              }
            }}
          >
            {field("name", "Name")}
            {field("email", "Work email", "email")}
            {field("company", "Company")}
            {field("teamSize", "Team size")}
            {state === "error" && <p className="rounded-[10px] bg-bad-bg px-3 py-2 text-[13px] text-bad">We couldn't save that. Check your email address and try again.</p>}
            <button disabled={state === "sending"} className="w-full rounded-full bg-brand py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {state === "sending" ? "Sending…" : "Request a call"}
            </button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
