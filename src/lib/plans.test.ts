import { describe, it, expect } from "vitest";
import { slotsForPlan, PLAN_PRICE_KRW } from "./plans";

describe("slotsForPlan", () => {
  it("returns 3 for FREE", () => {
    expect(slotsForPlan("FREE")).toBe(3);
  });
  it("returns 5 for PRO", () => {
    expect(slotsForPlan("PRO")).toBe(5);
  });
  it("returns 20 for BUSINESS", () => {
    expect(slotsForPlan("BUSINESS")).toBe(20);
  });
});

describe("PLAN_PRICE_KRW", () => {
  it("FREE is 0", () => {
    expect(PLAN_PRICE_KRW.FREE).toBe(0);
  });
  it("PRO is 9900", () => {
    expect(PLAN_PRICE_KRW.PRO).toBe(9900);
  });
  it("BUSINESS is 29000", () => {
    expect(PLAN_PRICE_KRW.BUSINESS).toBe(29000);
  });
});
