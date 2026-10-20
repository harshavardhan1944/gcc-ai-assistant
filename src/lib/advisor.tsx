import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_INPUTS,
  diffInputs,
  formatCr,
  rankCities,
  templateSummary,
  type Inputs,
  type RankedCity,
} from "@/lib/score";
import {
  explainRanking,
  greet,
  loadConversation,
  saveGreeting,
  saveInputs,
  sendTurn,
  startConversation,
} from "@/lib/gcc.functions";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
  action?: { label: string; prevInputs: Inputs; undone?: boolean };
  error?: boolean;
}

const STORAGE_KEY = "gcc-atlas-conversation";

/** If the AI wrapped its answer in a JSON object (e.g. {"reply": "..."}), unwrap the plain reply. */
function extractReply(t: string): string {
  const s = (t ?? "").trim();
  if (!s.startsWith("{")) return s;
  try {
    const j = JSON.parse(s) as { reply?: unknown; text?: unknown };
    if (typeof j.reply === "string" && j.reply.trim()) return j.reply.trim();
    if (typeof j.text === "string" && j.text.trim()) return j.text.trim();
  } catch {
    // not valid JSON — show as-is
  }
  return s;
}
const DEFAULT_FOLLOWUPS = [
  "Why is Chennai ahead of Mumbai?",
  "What if we hire 250 people?",
  "Is Hyderabad's GCC count reliable?",
];

function templateGreeting(r: RankedCity[]) {
  return `Welcome. For the example plan of 120 people, ${r[0].city.name} and ${r[1].city.name} tie at ${r[0].score}, with ${r[0].city.name} ahead on cost at ${formatCr(r[0].costCr)} a year [F1][R1]. Tell me about your team and I'll update the assumptions, compare cities or explain the incentives.`;
}

interface Ctx {
  ready: boolean;
  conversationId: string | null;
  inputs: Inputs;
  ranked: RankedCity[];
  messages: ChatMessage[];
  sending: boolean;
  aiAvailable: boolean;
  bannerDismissed: boolean;
  dismissBanner: () => void;
  flashKeys: string[];
  setInputs: (i: Inputs) => void;
  send: (text: string) => Promise<void>;
  undo: (messageId: string) => void;
  newConversation: () => Promise<void>;
  explanation: { text: string; ai: boolean; loading: boolean; stale: boolean };
  refreshExplanation: () => void;
  compare: [string, string] | null;
  setCompare: (c: [string, string] | null) => void;
  flexOpen: boolean;
  setFlexOpen: (b: boolean) => void;
  hoverCity: string | null;
  setHoverCity: (id: string | null) => void;
}

const AdvisorContext = createContext<Ctx | null>(null);

export function useAdvisor() {
  const c = useContext(AdvisorContext);
  if (!c) throw new Error("useAdvisor outside provider");
  return c;
}

function flashDiff(a: Inputs, b: Inputs) {
  const k: string[] = [];
  if (a.headcount !== b.headcount) k.push("people");
  if (a.seniorShare !== b.seniorShare) k.push("senior");
  if (a.sqftPerPerson !== b.sqftPerPerson) k.push("sqft");
  if (a.parentGlobal2000 !== b.parentGlobal2000) k.push("parent");
  if (JSON.stringify(a.weights) !== JSON.stringify(b.weights)) k.push("weights");
  return k;
}

export function AdvisorProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputs, setInputsState] = useState<Inputs>(DEFAULT_INPUTS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [flashKeys, setFlashKeys] = useState<string[]>([]);
  const [explanation, setExplanation] = useState({ text: "", ai: false, loading: true, stale: false });
  const [compare, setCompare] = useState<[string, string] | null>(null);
  const [flexOpen, setFlexOpen] = useState(false);
  const [hoverCity, setHoverCity] = useState<string | null>(null);
  const ranked = useMemo(() => rankCities(inputs), [inputs]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  const applyInputs = useCallback((next: Inputs, persist: boolean, id = conversationId) => {
    setFlashKeys(flashDiff(inputsRef.current, next));
    setTimeout(() => setFlashKeys([]), 350);
    setInputsState(next);
    if (persist && id) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveInputs({ data: { id, inputs: next } }).catch(console.error);
      }, 500);
    }
  }, [conversationId]);

  const refreshExplanation = useCallback(async (i?: Inputs) => {
    const use = i ?? inputsRef.current;
    setExplanation((e) => ({ ...e, loading: true }));
    try {
      const r = await explainRanking({ data: { inputs: use } });
      setExplanation({ text: extractReply(r.text), ai: r.ok, loading: false, stale: false });
      if (!r.ok) setAiAvailable(false);
    } catch {
      setExplanation({ text: templateSummary(rankCities(use)), ai: false, loading: false, stale: false });
      setAiAvailable(false);
    }
  }, []);

  const bootstrapNew = useCallback(async () => {
    const { id } = await startConversation();
    localStorage.setItem(STORAGE_KEY, id);
    setConversationId(id);
    setInputsState(DEFAULT_INPUTS);
    setMessages([]);
    setReady(true);
    refreshExplanation(DEFAULT_INPUTS);
    let text = templateGreeting(rankCities(DEFAULT_INPUTS));
    try {
      const g = await greet();
      if (g.ok) text = extractReply(g.text);
      else setAiAvailable(false);
    } catch {
      setAiAvailable(false);
    }
    const msg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: text, followUps: [] };
    setMessages([msg]);
    saveGreeting({ data: { id, content: text, followUps: [] } }).catch(console.error);
  }, [refreshExplanation]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    (async () => {
      try {
        if (saved) {
          const conv = await loadConversation({ data: { id: saved } });
          if (conv) {
            setConversationId(conv.id);
            setInputsState(conv.inputs);
            setMessages(
              conv.messages.map((m) => {
                const meta = (m.meta ?? {}) as { followUps?: string[]; prevInputs?: Inputs | null };
                return {
                  id: m.id,
                  role: m.role as "user" | "assistant",
                  content: m.content,
                  followUps: meta.followUps,
                  action:
                    meta.prevInputs && m.inputs
                      ? { label: diffInputs(meta.prevInputs, m.inputs as unknown as Inputs), prevInputs: meta.prevInputs }
                      : undefined,
                };
              }),
            );
            setReady(true);
            refreshExplanation(conv.inputs);
            return;
          }
        }
        await bootstrapNew();
      } catch (e) {
        console.error(e);
        setMessages([{ id: "local", role: "assistant", content: templateGreeting(rankCities(DEFAULT_INPUTS)) }]);
        setExplanation({ text: templateSummary(rankCities(DEFAULT_INPUTS)), ai: false, loading: false, stale: false });
        setReady(true);
      }
    })();
  }, [bootstrapNew, refreshExplanation]);

  const setInputs = useCallback((i: Inputs) => {
    applyInputs(i, true);
    setExplanation((e) => ({ ...e, stale: true }));
  }, [applyInputs]);

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || sending) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: t };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      if (!conversationId) throw new Error("no conversation");
      const r = await sendTurn({ data: { id: conversationId, message: t, inputs: inputsRef.current } });
      if (!r.ok) {
        setAiAvailable(false);
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: r.reply, error: true }]);
        return;
      }
      setAiAvailable(true);
      const msg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: r.reply, followUps: r.followUps };
      if (r.newInputs) {
        msg.action = { label: diffInputs(r.prevInputs, r.newInputs), prevInputs: r.prevInputs };
        applyInputs(r.newInputs, false);
        if (r.explanation) setExplanation({ text: r.explanation, ai: true, loading: false, stale: false });
        else refreshExplanation(r.newInputs);
      }
      if (r.compare) setCompare(r.compare);
      setMessages((m) => [...m, msg]);
    } catch (e) {
      console.error(e);
      setAiAvailable(false);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm unavailable right now, but you can still change the assumptions and the ranking will update.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [conversationId, sending, applyInputs, refreshExplanation]);

  const undo = useCallback((messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.action || msg.action.undone) return;
    applyInputs(msg.action.prevInputs, true);
    setExplanation((e) => ({ ...e, stale: true }));
    setMessages((ms) => ms.map((m) => (m.id === messageId && m.action ? { ...m, action: { ...m.action, undone: true } } : m)));
  }, [messages, applyInputs]);

  const newConversation = useCallback(async () => {
    setReady(false);
    setCompare(null);
    try {
      await bootstrapNew();
    } catch (e) {
      console.error(e);
      setReady(true);
    }
  }, [bootstrapNew]);

  const value: Ctx = {
    ready, conversationId, inputs, ranked, messages, sending, aiAvailable,
    bannerDismissed, dismissBanner: () => setBannerDismissed(true), flashKeys,
    setInputs, send, undo, newConversation, explanation,
    refreshExplanation: () => refreshExplanation(), compare, setCompare, flexOpen, setFlexOpen,
    hoverCity, setHoverCity,
  };
  return <AdvisorContext.Provider value={value}>{children}</AdvisorContext.Provider>;
}

export { DEFAULT_FOLLOWUPS };
