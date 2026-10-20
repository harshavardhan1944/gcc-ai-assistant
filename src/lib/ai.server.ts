import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError, type ModelMessage } from "ai";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";
const BASE = "https://ai.gateway.lovable.dev/v1";

export class AiUnavailable extends Error {}

function provider() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AiUnavailable("missing key");
  let runId: string | undefined;
  return createOpenAI({
    baseURL: BASE,
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      if (!res.ok) throw new AiUnavailable(`gateway ${res.status}`);
      return res;
    },
  });
}

const opts = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export const understandSchema = z.object({
  intent: z.enum(["question", "update_inputs", "compare", "next_step", "out_of_scope"]),
  updates: z.object({
    headcount: z.number().nullable(),
    seniorShare: z.number().nullable(),
    sqftPerPerson: z.number().nullable(),
    parentGlobal2000: z.boolean().nullable(),
    weights: z.object({
      cost: z.number().nullable(),
      talent: z.number().nullable(),
      ecosystem: z.number().nullable(),
    }),
  }),
  compareCities: z.array(z.string()),
  outOfScopeTopic: z.string().nullable(),
  reply: z.string(),
  followUps: z.array(z.string()),
});
export type Understanding = z.infer<typeof understandSchema>;

export async function understand(instructions: string, messages: ModelMessage[]): Promise<Understanding> {
  const result = streamText({
    model: provider().responses(MODEL),
    instructions,
    messages,
    output: Output.object({ schema: understandSchema }),
    providerOptions: opts,
  });
  try {
    return await result.output;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new AiUnavailable("bad output");
    if (e instanceof AiUnavailable) throw e;
    throw new AiUnavailable(String(e));
  }
}

export async function writeText(instructions: string, messages: ModelMessage[]): Promise<string> {
  try {
    const result = streamText({
      model: provider().responses(MODEL),
      instructions,
      messages,
      providerOptions: opts,
    });
    const t = (await result.text).trim();
    if (!t) throw new AiUnavailable("empty");
    return t;
  } catch (e) {
    if (e instanceof AiUnavailable) throw e;
    throw new AiUnavailable(String(e));
  }
}
