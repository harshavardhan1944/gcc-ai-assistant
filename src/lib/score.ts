import { CITIES, type City } from "@/data/cities";

export type ParentStatus = "yes" | "no" | "unsure";

export interface Inputs {
  headcount: number;
  seniorShare: number;
  sqftPerPerson: number;
  parentGlobal2000: ParentStatus;
  weights: { cost: number; talent: number; ecosystem: number };
}

export const DEFAULT_INPUTS: Inputs = {
  headcount: 120,
  seniorShare: 0.3,
  sqftPerPerson: 100,
  parentGlobal2000: "no",
  weights: { cost: 5, talent: 4, ecosystem: 2 },
};

export type Tone = "good" | "warning" | "bad" | "neutral";

export interface RankedCity {
  city: City;
  rank: number;
  payrollCr: number;
  officeCr: number;
  costCr: number;
  score: number;
  breakdown: { cost: number; talent: number; ecosystem: number };
  incentive: { label: string; tone: Tone };
  confidence: { sourced: number; total: number; conflicts: number; label: string };
}

export function payrollCr(c: City, i: Inputs) {
  return (i.headcount * (i.seniorShare * c.seniorMedian + (1 - i.seniorShare) * c.seMedian)) / 100;
}
export function officeCr(c: City, i: Inputs) {
  return (i.headcount * i.sqftPerPerson * c.avgRent * 12) / 10_000_000;
}

function normalise(values: number[], invert = false) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((v) => {
    if (max === min) return 1;
    const n = (v - min) / (max - min);
    return invert ? 1 - n : n;
  });
}

export function incentiveStatus(c: City, i: Inputs): { label: string; tone: Tone } {
  if (c.id === "chennai") {
    if (i.parentGlobal2000 === "yes" && i.headcount >= 200) return { label: "Likely eligible", tone: "good" };
    if (i.parentGlobal2000 === "no") return { label: "Not eligible: parent not Global 2000", tone: "bad" };
    if (i.headcount < 200) return { label: "Not eligible: under 200 jobs", tone: "bad" };
    return { label: "Check parent eligibility", tone: "warning" };
  }
  if (c.id === "bengaluru") return { label: "Incentives, larger outside Bengaluru", tone: "warning" };
  return { label: "Incentives: check terms", tone: "neutral" };
}

export function dataConfidence(c: City) {
  const facts = [true, true, c.primeRent, c.gccCount, c.gccShare, c.incentive];
  const sourced = facts.filter(Boolean).length;
  const conflicts = [c.primeRent, c.gccCount, c.gccShare].filter((f) => f?.conflict).length;
  const label = `${sourced} of 6 facts sourced${conflicts ? ` · ${conflicts} conflict${conflicts > 1 ? "s" : ""}` : ""}`;
  return { sourced, total: 6, conflicts, label };
}

export function clampInputs(i: Inputs): Inputs {
  const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    headcount: Math.round(cl(i.headcount, 10, 2000)),
    seniorShare: Math.round(cl(i.seniorShare, 0, 1) * 100) / 100,
    sqftPerPerson: Math.round(cl(i.sqftPerPerson, 40, 300)),
    parentGlobal2000: i.parentGlobal2000,
    weights: {
      cost: Math.round(cl(i.weights.cost, 0, 5)),
      talent: Math.round(cl(i.weights.talent, 0, 5)),
      ecosystem: Math.round(cl(i.weights.ecosystem, 0, 5)),
    },
  };
}

export function rankCities(inputs: Inputs, cities: City[] = CITIES): RankedCity[] {
  const pay = cities.map((c) => payrollCr(c, inputs));
  const off = cities.map((c) => officeCr(c, inputs));
  const cost = pay.map((p, k) => p + off[k]);
  const costN = normalise(cost, true);
  const talentN = normalise(cities.map((c) => c.professionalsM));
  const ecoN = normalise(cities.map((c) => c.companies25));
  const { cost: wc, talent: wt, ecosystem: we } = inputs.weights;
  const denom = wc + wt + we || 1;
  const rows = cities.map((city, k) => {
    const breakdown = {
      cost: (100 * wc * costN[k]) / denom,
      talent: (100 * wt * talentN[k]) / denom,
      ecosystem: (100 * we * ecoN[k]) / denom,
    };
    return {
      city,
      rank: 0,
      payrollCr: pay[k],
      officeCr: off[k],
      costCr: cost[k],
      score: Math.round(breakdown.cost + breakdown.talent + breakdown.ecosystem),
      breakdown,
      incentive: incentiveStatus(city, inputs),
      confidence: dataConfidence(city),
    };
  });
  rows.sort((a, b) => b.score - a.score || a.costCr - b.costCr);
  rows.forEach((r, k) => (r.rank = k + 1));
  return rows;
}

export function formatCr(v: number) {
  return `₹${Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)} Cr`;
}

export function inputsSummary(i: Inputs) {
  return {
    people: `${i.headcount} people`,
    senior: `${Math.round(i.seniorShare * 100)}% senior`,
    sqft: `${i.sqftPerPerson} sq ft each`,
    parent: i.parentGlobal2000 === "yes" ? "Parent: Global 2000" : i.parentGlobal2000 === "no" ? "Parent: not Global 2000" : "Parent: not sure",
    weights: `Cost ${i.weights.cost} · Talent ${i.weights.talent} · Ecosystem ${i.weights.ecosystem}`,
  };
}

export function diffInputs(a: Inputs, b: Inputs): string {
  const parts: string[] = [];
  const s = inputsSummary(b);
  if (a.headcount !== b.headcount) parts.push(s.people);
  if (a.seniorShare !== b.seniorShare) parts.push(s.senior);
  if (a.sqftPerPerson !== b.sqftPerPerson) parts.push(s.sqft);
  if (a.parentGlobal2000 !== b.parentGlobal2000) parts.push(s.parent);
  if (a.weights.cost !== b.weights.cost) parts.push(`Cost ${b.weights.cost}`);
  if (a.weights.talent !== b.weights.talent) parts.push(`Talent ${b.weights.talent}`);
  if (a.weights.ecosystem !== b.weights.ecosystem) parts.push(`Ecosystem ${b.weights.ecosystem}`);
  return parts.join(" · ");
}

/** Template explanation used when AI is unavailable. */
export function templateSummary(ranked: RankedCity[]) {
  const [a, b] = ranked;
  const s1 = `${a.city.name} ranks first with a score of ${a.score}, at an estimated ${formatCr(a.costCr)} a year [F1][R1].`;
  const s2 =
    a.score === b.score
      ? `${b.city.name} has the same score of ${b.score} but costs ${formatCr(b.costCr)} a year, so ${a.city.name} wins the tie on cost [F1][R1].`
      : `${b.city.name} is second with ${b.score}, at ${formatCr(b.costCr)} a year [F1][R1].`;
  const s3 = `${a.city.name} tracks ${a.city.professionalsM}M professionals versus ${b.city.professionalsM}M in ${b.city.name} [F1].`;
  return [s1, s2, s3].join(" ");
}

/** Text form of the ranking, with source codes, for the AI prompt. */
export function rankingForPrompt(ranked: RankedCity[]) {
  return ranked
    .map(
      (r) =>
        `#${r.rank} ${r.city.name}: score ${r.score} (cost part ${r.breakdown.cost.toFixed(1)}, talent part ${r.breakdown.talent.toFixed(1)}, ecosystem part ${r.breakdown.ecosystem.toFixed(1)}); total cost ${formatCr(r.costCr)}/yr [F1][R1]; payroll ${formatCr(r.payrollCr)} [F1]; office ${formatCr(r.officeCr)} [R1]; incentive status: ${r.incentive.label}; data: ${r.confidence.label}`,
    )
    .join("\n");
}
