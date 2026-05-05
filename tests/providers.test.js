import { describe, expect, it } from "vitest";
import { generateLeadExplanation } from "../server/core/explanationService.js";
import { getProviderAdapter, LiveAdapterNotConfiguredError } from "../server/providers/registry.js";

describe("provider registry", () => {
  it("resolves mock adapters independently by provider key and mode", async () => {
    const notification = getProviderAdapter("sales-notification", "mock");
    const nurture = getProviderAdapter("nurture", "mock");

    await expect(notification.notify({ lead: { name: "Ava Prospect" }, rep: { name: "Morgan" } })).resolves.toMatchObject({
      status: "delivered",
      providerKey: "sales-notification",
      mode: "mock"
    });
    await expect(nurture.enrollInNurture({ lead: { name: "Cold Lead" }, sequence: { name: "Long Tail" } })).resolves.toMatchObject({
      status: "enrolled",
      providerKey: "nurture",
      mode: "mock"
    });
  });

  it("throws a clear error when a live adapter is not configured", () => {
    expect(() => getProviderAdapter("sales-notification", "live")).toThrow(LiveAdapterNotConfiguredError);
    expect(() => getProviderAdapter("sales-notification", "live")).toThrow(
      "Live adapter for sales-notification is not configured"
    );
  });
});

describe("generateLeadExplanation", () => {
  it("uses AI assessment text when enabled and adapter succeeds", async () => {
    const result = await generateLeadExplanation({
      lead: { name: "Parker Medical", industry: "medical_practice" },
      scoreResult: scoreResult(),
      aiEnabled: true,
      aiAdapter: {
        assessLead: async () => ({
          explanation: "Parker Medical is qualified because budget and urgency both match the target profile."
        })
      }
    });

    expect(result).toEqual({
      explanation: "Parker Medical is qualified because budget and urgency both match the target profile.",
      fallbackUsed: false,
      enabled: true
    });
  });

  it("falls back to deterministic explanation when AI is disabled", async () => {
    const result = await generateLeadExplanation({
      lead: { name: "Cold Plumbing" },
      scoreResult: scoreResult({ tier: "nurture" }),
      aiEnabled: false,
      aiAdapter: {
        assessLead: async () => {
          throw new Error("should not be called");
        }
      }
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.enabled).toBe(false);
    expect(result.explanation).toContain("Cold Plumbing is nurture");
    expect(result.explanation).toContain("Budget fit");
  });

  it("falls back to deterministic explanation when AI adapter fails", async () => {
    const result = await generateLeadExplanation({
      lead: { name: "Borderline Realty" },
      scoreResult: scoreResult({ tier: "review" }),
      aiEnabled: true,
      aiAdapter: {
        assessLead: async () => {
          throw new Error("provider unavailable");
        }
      }
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.enabled).toBe(true);
    expect(result.explanation).toContain("Borderline Realty is review");
  });
});

function scoreResult(overrides = {}) {
  return {
    finalScore: 82,
    tier: "qualified",
    matchedRules: [{ id: "rule_budget", label: "Budget fit", points: 25 }],
    missedCriteria: [{ id: "rule_location", label: "Location fit", expected: "Florida", actual: "Ohio" }],
    ...overrides
  };
}
