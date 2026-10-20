import { useEffect, useRef, useState } from "react";
import { ArrowUp, Compass, RotateCcw, Sparkles, SquarePen, Undo2 } from "lucide-react";
import { useAdvisor } from "@/lib/advisor";
import { TaggedText } from "./SourceTag";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Which city is cheapest for 150 backend engineers?",
  "What if we hire 250 people?",
  "Can we get Tamil Nadu's subsidy?",
  "Compare Bengaluru and Hyderabad",
];

export function AssistantPanel({ className, inputId = "chat-input" }: { className?: string; inputId?: string }) {
  const { messages, send, sending, undo, newConversation, ready } = useAdvisor();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);
  useEffect(() => {
    if (!sending) inputRef.current?.focus();
  }, [sending]);

  const submit = (t: string) => {
    if (!t.trim() || sending) return;
    setText("");
    send(t);
  };
  const userCount = messages.filter((m) => m.role === "user").length;
  const last = messages[messages.length - 1];

  return (
    <section aria-label="GCC assistant" className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-primary-foreground">
          <Compass size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">GCC assistant</p>
          <p className="text-[12px] text-muted-foreground">Answers use only sourced data</p>
        </div>
        <button
          onClick={() => newConversation()}
          title="New conversation"
          aria-label="New conversation"
          className="rounded-[10px] p-2 text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground"
        >
          <SquarePen size={18} />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {!ready && (
          <div className="space-y-2">
            <div className="shimmer h-4 w-3/4 rounded" />
            <div className="shimmer h-4 w-2/3 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[92%] whitespace-pre-wrap px-4 py-3 text-[15px] leading-[1.55]",
                m.role === "user"
                  ? "rounded-[14px] rounded-tr-[4px] bg-ink text-ink-foreground"
                  : "rounded-[14px] rounded-tl-[4px] bg-sunken",
              )}
            >
              {m.role === "assistant" ? <TaggedText text={m.content} /> : m.content}
            </div>
            {m.action && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-full border border-brand bg-brand-soft px-3 py-1 text-[12px]">
                <span>{m.action.undone ? "Undone" : "Updated"}: {m.action.label}</span>
                {!m.action.undone && (
                  <button onClick={() => undo(m.id)} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                    <Undo2 size={14} aria-hidden /> Undo
                  </button>
                )}
              </div>
            )}
            {m === last && m.role === "assistant" && m.followUps && m.followUps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.followUps.map((f) => (
                  <button
                    key={f}
                    onClick={() => submit(f)}
                    disabled={sending}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-[13px] transition-colors duration-150 hover:border-brand hover:bg-brand-soft"
                  >
                    <Sparkles size={14} className="shrink-0 text-brand" aria-hidden />
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex w-fit items-center gap-1 rounded-[14px] rounded-tl-[4px] bg-sunken px-4 py-3" aria-label="Assistant is typing">
            {[0, 1, 2].map((k) => (
              <span key={k} className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: `${k * 0.15}s` }} />
            ))}
          </div>
        )}
        {ready && userCount === 0 && !sending && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="rounded-[10px] border p-3 text-left text-[13px] leading-snug transition-colors duration-150 hover:border-brand hover:bg-brand-soft"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="border-t px-4 pb-3 pt-3"
      >
        <div className="flex items-end gap-2 rounded-[14px] border bg-background p-2 focus-within:border-brand">
          <label htmlFor={inputId} className="sr-only">Ask the assistant</label>
          <textarea
            id={inputId}
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(text);
              }
            }}
            rows={1}
            placeholder="Ask about cities, costs, incentives…"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground transition-opacity duration-150 disabled:opacity-40"
          >
            {sending ? <RotateCcw size={18} className="animate-spin" /> : <ArrowUp size={18} />}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">AI explains; the ranking is computed from sourced data.</p>
      </form>
    </section>
  );
}
