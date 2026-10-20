import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CITIES, SOURCES } from "@/data/cities";
import {
  clampInputs,
  rankCities,
  rankingForPrompt,
  templateSummary,
  type Inputs,
  DEFAULT_INPUTS,
} from "@/lib/score";

const inputsSchema = z.object({
  headcount: z.number(),
  seniorShare: z.number(),
  sqftPerPerson: z.number(),
  parentGlobal2000: z.enum(["yes", "no", "unsure"]),
  weights: z.object({ cost: z.number(), talent: z.number(), ecosystem: z.number() }),
});

const INSTRUCTIONS =
  "You are the GCC assistant inside GCC Location Advisor, helping a company plan its first Global Capability Centre in India. The ranking and all figures are computed by the tool from sourced data; you never compute or invent numbers. Use only figures in DATA and CURRENT RANKING, and after each figure cite its source code in square brackets, e.g. [F1]. If something is not in the data, say GCC Atlas doesn't have verified data on it yet. Mention conflicts and missing data honestly. Cost figures are illustrative estimates from median pay and average rent, not quotes. No legal or tax advice. Be warm, direct and brief: 60–140 words, plain text, no headings. To change assumptions, put new values in `updates` rather than describing numbers you cannot compute. Always give three short, specific follow-up questions.";

function dataBlock() {
  const cities = CITIES.map(
    (c) =>
      `${c.name} (${c.state}): professionals tracked ${c.professionalsM}M [F1]; companies with 25+ people ${c.companies25} [F1]; SE median CTC ₹${c.seMedian} lakh [F1]; senior (6+ yrs) median ₹${c.seniorMedian} lakh [F1]; avg rent ₹${c.avgRent}/sq ft/month [R1]; prime rent ${c.primeRent ? c.primeRent.text + " [R2]" : "not available"}; GCC count ${c.gccCount ? `${c.gccCount.text} [${c.gccCount.sources.join("][")}]` : "no verified count"}; GCC share of office absorption H1 2026 ${c.gccShare ? c.gccShare.text + " [R3]" : "not reported"}; incentives: ${c.incentive.text} [${c.incentive.sources.join("][")}]`,
  ).join("\n");
  const sources = Object.entries(SOURCES)
    .map(([k, v]) => `${k}: ${v.title}`)
    .join("\n");
  return `DATA\n${cities}\n\nSOURCES\n${sources}\n\nINCENTIVE RULES: Chennai (Tamil Nadu payroll subsidy) is Likely eligible only if parent is Forbes Global 2000/Fortune 1000 AND headcount >= 200. Bengaluru: incentives larger outside Bengaluru. Others: check terms. Incentives are shown but not scored.\nSCORING: payroll = headcount × (senior share × senior median + (1 − senior share) × SE median)/100 Cr; office = headcount × sqft × avg rent × 12 / 1e7 Cr; cost, talent (professionals) and ecosystem (companies 25+) min-max normalised across six cities; weighted average × 100.`;
}

function inputsText(i: Inputs) {
  return `CURRENT INPUTS: headcount ${i.headcount}; senior share ${i.seniorShare}; sq ft per person ${i.sqftPerPerson}; parent Global 2000/Fortune 1000: ${i.parentGlobal2000}; weights cost ${i.weights.cost}, talent ${i.weights.talent}, ecosystem ${i.weights.ecosystem}`;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const startConversation = createServerFn({ method: "POST" }).handler(async () => {
  const db = await admin();
  const ranked = rankCities(DEFAULT_INPUTS);
  const { data, error } = await db
    .from("conversations")
    .insert({ inputs: DEFAULT_INPUTS as never, top_city: ranked[0].city.name })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
});

export const loadConversation = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: conv } = await db.from("conversations").select("id, inputs").eq("id", data.id).maybeSingle();
    if (!conv) return null;
    const { data: msgs, error } = await db
      .from("messages")
      .select("id, role, content, intent, inputs, meta, created_at")
      .eq("conversation_id", data.id)
      .order("created_at");
    if (error) throw new Error(error.message);
    return { id: conv.id, inputs: conv.inputs as unknown as Inputs, messages: msgs ?? [] };
  });

export const saveInputs = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; inputs: Inputs }) =>
    z.object({ id: z.string().uuid(), inputs: inputsSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const ranked = rankCities(data.inputs);
    await db
      .from("conversations")
      .update({ inputs: data.inputs as never, top_city: ranked[0].city.name, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const saveGreeting = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; content: string; followUps: string[] }) =>
    z.object({ id: z.string().uuid(), content: z.string(), followUps: z.array(z.string()) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from("messages").insert({
      conversation_id: data.id,
      role: "assistant",
      content: data.content,
      intent: "greeting",
      meta: { followUps: data.followUps } as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const greet = createServerFn({ method: "POST" }).handler(async () => {
  const ranked = rankCities(DEFAULT_INPUTS);
  try {
    const { writeText } = await import("@/lib/ai.server");
    const text = await writeText(INSTRUCTIONS, [
      {
        role: "user",
        content: `${dataBlock()}\n\n${inputsText(DEFAULT_INPUTS)}\n\nCURRENT RANKING\n${rankingForPrompt(ranked)}\n\nWrite a 2–3 sentence opening greeting that summarises this example result (top cities with cited figures) and offers next steps. Plain text, under 70 words. Do not include follow-up questions.`,
      },
    ]);
    return { ok: true as const, text };
  } catch {
    return { ok: false as const };
  }
});

const turnSchema = z.object({
  id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  inputs: inputsSchema,
});

export const sendTurn = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof turnSchema>) => turnSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const prevInputs = data.inputs as Inputs;
    const prevRanked = rankCities(prevInputs);

    const { data: hist } = await db
      .from("messages")
      .select("role, content")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const history = (hist ?? []).reverse().map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    await db.from("messages").insert({ conversation_id: data.id, role: "user", content: data.message, inputs: prevInputs as never });

    const unavailable = {
      ok: false as const,
      reply: "I'm unavailable right now, but you can still change the assumptions and the ranking will update.",
    };

    let u;
    try {
      const { understand } = await import("@/lib/ai.server");
      u = await understand(INSTRUCTIONS, [
        ...history,
        {
          role: "user",
          content: `${dataBlock()}\n\n${inputsText(prevInputs)}\n\nCURRENT RANKING\n${rankingForPrompt(prevRanked)}\n\nVALID CITIES for compareCities: ${CITIES.map((c) => c.name).join(", ")}. Set outOfScopeTopic to a 1–3 word topic when intent is out_of_scope, else null. Set update fields to null when unchanged. seniorShare is a fraction 0–1; weights 0–5.\n\nUSER MESSAGE: ${data.message}`,
        },
      ]);
    } catch {
      await db.from("messages").insert({ conversation_id: data.id, role: "assistant", content: unavailable.reply, intent: "error" });
      return unavailable;
    }

    const up = u.updates;
    const hasUpdate =
      up.headcount != null ||
      up.seniorShare != null ||
      up.sqftPerPerson != null ||
      up.parentGlobal2000 != null ||
      up.weights.cost != null ||
      up.weights.talent != null ||
      up.weights.ecosystem != null;

    let newInputs: Inputs | null = null;
    let reply = u.reply;
    let explanation: string | null = null;

    if (hasUpdate) {
      newInputs = clampInputs({
        headcount: up.headcount ?? prevInputs.headcount,
        seniorShare: up.seniorShare != null ? (up.seniorShare > 1 ? up.seniorShare / 100 : up.seniorShare) : prevInputs.seniorShare,
        sqftPerPerson: up.sqftPerPerson ?? prevInputs.sqftPerPerson,
        parentGlobal2000: up.parentGlobal2000 == null ? prevInputs.parentGlobal2000 : up.parentGlobal2000 ? "yes" : "no",
        weights: {
          cost: up.weights.cost ?? prevInputs.weights.cost,
          talent: up.weights.talent ?? prevInputs.weights.talent,
          ecosystem: up.weights.ecosystem ?? prevInputs.weights.ecosystem,
        },
      });
      const newRanked = rankCities(newInputs);
      try {
        const { writeText } = await import("@/lib/ai.server");
        reply = await writeText(INSTRUCTIONS, [
          {
            role: "user",
            content: `${dataBlock()}\n\nPREVIOUS ${inputsText(prevInputs)}\nPREVIOUS RANKING\n${rankingForPrompt(prevRanked)}\n\nNEW ${inputsText(newInputs)}\nNEW RANKING\n${rankingForPrompt(newRanked)}\n\nThe user said: "${data.message}". Explain what changed in the ranking, costs and incentive status, citing source codes. Plain text, 60–140 words, no follow-up questions.`,
          },
        ]);
        explanation = reply;
      } catch {
        reply = "I've updated the assumptions and the ranking has been recomputed, but I can't explain the change right now.";
      }
      const { error: e1 } = await db
        .from("conversations")
        .update({ inputs: newInputs as never, top_city: newRanked[0].city.name, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (e1) console.error(e1);
    }

    const valid = CITIES.map((c) => c.name);
    const compare =
      u.compareCities.length === 2 && u.compareCities.every((c) => valid.includes(c)) && u.compareCities[0] !== u.compareCities[1]
        ? (u.compareCities as [string, string])
        : null;

    const intent = hasUpdate ? "update_inputs" : compare ? "compare" : u.intent;
    const followUps = u.followUps.slice(0, 3);
    const meta = { followUps, compare, outOfScopeTopic: u.outOfScopeTopic, prevInputs: hasUpdate ? prevInputs : null };
    const { error } = await db.from("messages").insert({
      conversation_id: data.id,
      role: "assistant",
      content: reply,
      intent,
      inputs: (newInputs ?? prevInputs) as never,
      meta: meta as never,
    });
    if (error) console.error(error);

    return { ok: true as const, reply, intent, followUps, compare, newInputs, prevInputs, explanation };
  });

export const explainRanking = createServerFn({ method: "POST" })
  .inputValidator((d: { inputs: Inputs }) => z.object({ inputs: inputsSchema }).parse(d))
  .handler(async ({ data }) => {
    const ranked = rankCities(data.inputs as Inputs);
    try {
      const { writeText } = await import("@/lib/ai.server");
      const text = await writeText(INSTRUCTIONS, [
        {
          role: "user",
          content: `${dataBlock()}\n\n${inputsText(data.inputs as Inputs)}\n\nCURRENT RANKING\n${rankingForPrompt(ranked)}\n\nExplain why this ranking came out this way, focusing on the top two cities and what drives their scores. Plain text, 80–130 words, no follow-up questions.`,
        },
      ]);
      return { ok: true as const, text };
    } catch {
      return { ok: false as const, text: templateSummary(ranked) };
    }
  });

const leadSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(1).max(160),
  teamSize: z.string().trim().max(40),
  inputs: inputsSchema,
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof leadSchema>) => leadSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const ranked = rankCities(data.inputs as Inputs);
    const { error } = await db.from("leads").insert({
      conversation_id: data.conversationId,
      name: data.name,
      email: data.email,
      company: data.company,
      team_size: data.teamSize,
      inputs: data.inputs as never,
      top_city: ranked[0].city.name,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const [{ data: convs }, { data: msgs }, { data: leads }] = await Promise.all([
    db.from("conversations").select("id, top_city, created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("messages").select("conversation_id, role, content, intent, meta, created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("leads").select("conversation_id, created_at").limit(1000),
  ]);
  const c = convs ?? [];
  const m = msgs ?? [];
  const l = leads ?? [];
  const userTurns = m.filter((x) => x.role === "user");
  const assistantTurns = m.filter((x) => x.role === "assistant" && x.intent !== "greeting");
  const updated = assistantTurns.filter((x) => x.intent === "update_inputs").length;
  const convWithLead = new Set(l.map((x) => x.conversation_id).filter(Boolean));
  const convWithTurns = new Set(userTurns.map((x) => x.conversation_id));

  // Daily series (last 14 days)
  const days: string[] = [];
  for (let k = 13; k >= 0; k--) days.push(new Date(Date.now() - k * 864e5).toISOString().slice(0, 10));
  const byDay = (rows: { created_at: string }[]) => days.map((d) => rows.filter((r) => r.created_at.slice(0, 10) === d).length);

  const topCities: Record<string, number> = {};
  c.forEach((x) => x.top_city && (topCities[x.top_city] = (topCities[x.top_city] ?? 0) + 1));
  const oos: Record<string, number> = {};
  assistantTurns
    .filter((x) => x.intent === "out_of_scope")
    .forEach((x) => {
      const t = ((x.meta as { outOfScopeTopic?: string } | null)?.outOfScopeTopic ?? "other").toLowerCase();
      oos[t] = (oos[t] ?? 0) + 1;
    });

  // Pair recent user questions with following assistant intent
  const asc = [...m].reverse();
  const recent: { question: string; intent: string; at: string }[] = [];
  asc.forEach((x, k) => {
    if (x.role !== "user") return;
    const next = asc.slice(k + 1).find((y) => y.conversation_id === x.conversation_id && y.role === "assistant");
    recent.push({ question: x.content, intent: next?.intent ?? "pending", at: x.created_at });
  });

  return {
    conversations: c.length,
    avgTurns: convWithTurns.size ? userTurns.length / convWithTurns.size : 0,
    pctChanged: assistantTurns.length ? (100 * updated) / assistantTurns.length : 0,
    pctLead: c.length ? (100 * convWithLead.size) / c.length : 0,
    series: {
      conversations: byDay(c),
      turns: byDay(userTurns),
      changed: byDay(assistantTurns.filter((x) => x.intent === "update_inputs")),
      leads: byDay(l),
    },
    topCities: Object.entries(topCities).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    outOfScope: Object.entries(oos).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    recent: recent.reverse().slice(0, 20),
  };
});
