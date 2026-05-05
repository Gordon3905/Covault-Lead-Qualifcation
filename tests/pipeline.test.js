import { describe, expect, it } from "vitest";
import { processLead } from "../server/core/leadPipeline.js";
import { seedPipelineConfig } from "./pipelineFixture.js";

describe("processLead", () => {
  it("ingests, scores, explains, routes, notifies, and audits a qualified lead", async () => {
    const { repos, client, reps } = seedPipelineConfig();

    const result = await processLead({
      clientSlug: client.slug,
      source: "webhook",
      payload: {
        name: "Parker Medical",
        industry: "medical_practice",
        budget: 24000,
        urgency: "high",
        region: "Northeast"
      },
      repos
    });

    expect(result.scoring).toMatchObject({
      finalScore: 90,
      tier: "qualified"
    });
    expect(result.route).toMatchObject({
      repId: reps[0].id,
      strategy: "territory-team-round-robin"
    });
    expect(result.explanation.explanation).toContain("qualified lead");

    const detail = repos.leads.getLeadDetail(result.lead.id);
    expect(detail.route.repId).toBe(reps[0].id);
    expect(detail.auditEvents.map((event) => event.eventType)).toEqual([
      "lead.received",
      "lead.normalized",
      "scoring.started",
      "scoring.completed",
      "ai.assessment.started",
      "ai.assessment.completed",
      "routing.started",
      "routing.completed",
      "provider.adapter_call_started",
      "provider.adapter_call_succeeded"
    ]);
  });

  it("sends nurture leads to nurture instead of sales notification", async () => {
    const { repos, client } = seedPipelineConfig();

    const result = await processLead({
      clientSlug: client.slug,
      source: "webhook",
      payload: {
        name: "Cold Plumbing",
        industry: "plumbing",
        budget: 1000,
        urgency: "low",
        region: "Central"
      },
      repos
    });

    expect(result.scoring.tier).toBe("nurture");
    expect(result.route).toBe(null);
    expect(result.delivery.providerKey).toBe("nurture");

    const detail = repos.leads.getLeadDetail(result.lead.id);
    expect(detail.auditEvents.map((event) => event.eventType)).toContain("provider.adapter_call_succeeded");
  });
});
