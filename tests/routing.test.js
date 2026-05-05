import { describe, expect, it } from "vitest";
import { routeLead } from "../server/core/routingEngine.js";

const territoryVersion = {
  id: "terrver_2026_q2",
  clientId: "client_real_estate",
  name: "Q2 territories"
};

describe("routeLead", () => {
  it("assigns directly when a territory maps to one rep", () => {
    const lead = { industry: "law_firm", region: "Southeast", accountSize: "mid_market" };
    const reps = [rep("rep_ava", "Ava", "team_legal"), rep("rep_noah", "Noah", "team_general")];
    const territories = [
      territory("terr_legal_se", "Legal Southeast", 10, [{ field: "industry", operator: "equals", value: "law_firm" }], {
        repId: "rep_ava"
      })
    ];

    const result = routeLead({ lead, territoryVersion, territories, reps, cursorStore: new MemoryCursorStore() });

    expect(result).toMatchObject({
      territoryRuleVersionId: territoryVersion.id,
      territoryId: "terr_legal_se",
      repId: "rep_ava",
      teamId: "team_legal",
      strategy: "territory-direct"
    });
    expect(result.reason).toContain("Legal Southeast");
  });

  it("round-robins within a matched territory team and persists the cursor", () => {
    const lead = { industry: "medical_practice", region: "Northeast" };
    const reps = [
      rep("rep_mia", "Mia", "team_medical"),
      rep("rep_eli", "Eli", "team_medical"),
      rep("rep_sam", "Sam", "team_general")
    ];
    const territories = [
      territory("terr_med_ne", "Medical Northeast", 8, [{ field: "industry", operator: "equals", value: "medical_practice" }], {
        teamId: "team_medical"
      })
    ];
    const cursorStore = new MemoryCursorStore();

    const first = routeLead({ lead, territoryVersion, territories, reps, cursorStore });
    const second = routeLead({ lead, territoryVersion, territories, reps, cursorStore });

    expect(first.repId).toBe("rep_mia");
    expect(second.repId).toBe("rep_eli");
    expect(first.strategy).toBe("territory-team-round-robin");
    expect(second.strategy).toBe("territory-team-round-robin");
  });

  it("chooses the highest priority territory and specificity as a tie-breaker", () => {
    const lead = { industry: "real_estate", region: "West", accountSize: "enterprise" };
    const reps = [rep("rep_june", "June", "team_enterprise"), rep("rep_omar", "Omar", "team_west")];
    const territories = [
      territory("terr_west", "West", 5, [{ field: "region", operator: "equals", value: "West" }], { repId: "rep_omar" }),
      territory(
        "terr_west_enterprise",
        "West Enterprise",
        5,
        [
          { field: "region", operator: "equals", value: "West" },
          { field: "accountSize", operator: "equals", value: "enterprise" }
        ],
        { repId: "rep_june" }
      )
    ];

    const result = routeLead({ lead, territoryVersion, territories, reps, cursorStore: new MemoryCursorStore() });

    expect(result.territoryId).toBe("terr_west_enterprise");
    expect(result.repId).toBe("rep_june");
  });

  it("falls back to full-team round-robin when no territory matches", () => {
    const lead = { industry: "plumbing", region: "Central", accountSize: "small_business" };
    const reps = [rep("rep_ivy", "Ivy", "team_general"), rep("rep_luis", "Luis", "team_general")];
    const territories = [
      territory("terr_real_estate", "Real Estate", 10, [{ field: "industry", operator: "equals", value: "real_estate" }], {
        teamId: "team_real_estate"
      })
    ];
    const cursorStore = new MemoryCursorStore();

    const first = routeLead({ lead, territoryVersion, territories, reps, cursorStore });
    const second = routeLead({ lead, territoryVersion, territories, reps, cursorStore });

    expect(first).toMatchObject({
      territoryRuleVersionId: territoryVersion.id,
      territoryId: null,
      repId: "rep_ivy",
      strategy: "full-team-round-robin"
    });
    expect(second.repId).toBe("rep_luis");
  });

  it("throws a clear error when fallback routing has no active reps", () => {
    const lead = { industry: "plumbing" };

    expect(() =>
      routeLead({ lead, territoryVersion, territories: [], reps: [], cursorStore: new MemoryCursorStore() })
    ).toThrow("Cannot route lead without active reps");
  });
});

function territory(id, name, priority, conditions, assignment) {
  return {
    id,
    name,
    priority,
    conditions,
    teamId: assignment.teamId ?? null,
    repId: assignment.repId ?? null
  };
}

function rep(id, name, teamId) {
  return {
    id,
    name,
    teamId,
    active: true
  };
}

class MemoryCursorStore {
  constructor() {
    this.cursors = new Map();
  }

  getAndAdvance({ scopeKey, repIds }) {
    const current = this.cursors.get(scopeKey) ?? 0;
    const selectedRepId = repIds[current % repIds.length];
    const nextIndex = (current + 1) % repIds.length;
    this.cursors.set(scopeKey, nextIndex);
    return { scopeKey, selectedRepId, previousIndex: current, nextIndex };
  }
}
