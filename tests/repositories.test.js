import { describe, expect, it } from "vitest";
import { createRepositories } from "../server/repositories/index.js";
import { createTestDatabase } from "./testDb.js";

describe("repositories", () => {
  it("stores immutable scoring results with rule version references", () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const client = repos.clients.create({ name: "Demo Realty", slug: "real-estate" });
    const version = repos.rules.createScoringVersion({ clientId: client.id, name: "Initial", active: true });
    const lead = repos.leads.createLead({ clientId: client.id, source: "mock", payload: { industry: "real_estate" } });

    repos.leads.saveScoringResult({
      leadId: lead.id,
      scoringRuleVersionId: version.id,
      finalScore: 82,
      tier: "qualified",
      breakdown: [{ label: "Industry fit", points: 30 }]
    });

    const detail = repos.leads.getLeadDetail(lead.id);
    expect(detail.scoring.scoringRuleVersionId).toBe(version.id);
    expect(detail.scoring.finalScore).toBe(82);
  });
});
