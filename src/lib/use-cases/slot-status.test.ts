import { describe, it, expect } from "vitest";
import { computeSlotStatus } from "./slot-status";
import type { OwnerService } from "@/lib/repositories/services";

function svc(status: OwnerService["status"]): OwnerService {
  return {
    id: crypto.randomUUID(),
    title: "x",
    status,
    url: "https://example.com",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("computeSlotStatus", () => {
  it("FREE plan: 0 services → has room", () => {
    const r = computeSlotStatus([], "FREE");
    expect(r).toEqual({ plan: "FREE", slots: 3, activeCount: 0, hasRoom: true });
  });

  it("FREE plan: 3 PUBLISHED → full", () => {
    const services = Array.from({ length: 3 }, () => svc("PUBLISHED"));
    const r = computeSlotStatus(services, "FREE");
    expect(r.activeCount).toBe(3);
    expect(r.hasRoom).toBe(false);
  });

  it("counts PENDING_VERIFY as active", () => {
    const services = Array.from({ length: 3 }, () => svc("PENDING_VERIFY"));
    const r = computeSlotStatus(services, "FREE");
    expect(r.activeCount).toBe(3);
    expect(r.hasRoom).toBe(false);
  });

  it("does not count DRAFT, HIDDEN, REJECTED", () => {
    const r = computeSlotStatus(
      [svc("DRAFT"), svc("HIDDEN"), svc("REJECTED")],
      "FREE",
    );
    expect(r.activeCount).toBe(0);
    expect(r.hasRoom).toBe(true);
  });

  it("PRO plan: 4 active → still has room (slots=5)", () => {
    const services = Array.from({ length: 4 }, () => svc("PUBLISHED"));
    const r = computeSlotStatus(services, "PRO");
    expect(r.slots).toBe(5);
    expect(r.activeCount).toBe(4);
    expect(r.hasRoom).toBe(true);
  });

  it("PRO plan: 5 active → full", () => {
    const services = Array.from({ length: 5 }, () => svc("PUBLISHED"));
    const r = computeSlotStatus(services, "PRO");
    expect(r.hasRoom).toBe(false);
  });

  it("BUSINESS plan: 19 active + DRAFT mix", () => {
    const services = [
      ...Array.from({ length: 19 }, () => svc("PUBLISHED")),
      svc("DRAFT"),
      svc("HIDDEN"),
    ];
    const r = computeSlotStatus(services, "BUSINESS");
    expect(r.slots).toBe(20);
    expect(r.activeCount).toBe(19);
    expect(r.hasRoom).toBe(true);
  });
});
