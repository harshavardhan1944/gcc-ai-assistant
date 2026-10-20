import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS, rankCities, formatCr, incentiveStatus } from "./score";
import { CITIES } from "@/data/cities";

describe("rankCities", () => {
  it("ranks the default example in the specified order and scores", () => {
    const r = rankCities(DEFAULT_INPUTS);
    expect(r.map((x) => [x.city.name, x.score])).toEqual([
      ["Chennai", 62],
      ["Mumbai", 62],
      ["Hyderabad", 59],
      ["Bengaluru", 55],
      ["Delhi NCR", 43],
      ["Pune", 35],
    ]);
  });
  it("computes Chennai payroll 13.3 Cr and office 1.04 Cr", () => {
    const c = rankCities(DEFAULT_INPUTS).find((x) => x.city.id === "chennai")!;
    expect(c.payrollCr.toFixed(1)).toBe("13.3");
    expect(c.officeCr.toFixed(2)).toBe("1.04");
  });
  it("formats crores", () => {
    expect(formatCr(13.32)).toBe("₹13.3 Cr");
    expect(formatCr(123.4)).toBe("₹123 Cr");
  });
  it("Chennai subsidy needs a Global 2000 parent and 200 jobs", () => {
    const ch = CITIES.find((c) => c.id === "chennai")!;
    expect(incentiveStatus(ch, { ...DEFAULT_INPUTS, headcount: 250, parentGlobal2000: "yes" }).label).toBe("Likely eligible");
    expect(incentiveStatus(ch, { ...DEFAULT_INPUTS, headcount: 250, parentGlobal2000: "no" }).tone).toBe("bad");
    expect(incentiveStatus(ch, { ...DEFAULT_INPUTS, headcount: 150, parentGlobal2000: "yes" }).label).toBe("Not eligible: under 200 jobs");
    expect(incentiveStatus(ch, { ...DEFAULT_INPUTS, headcount: 250, parentGlobal2000: "unsure" }).label).toBe("Check parent eligibility");
  });
});
