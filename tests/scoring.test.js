import { describe, expect, it } from "vitest";
import { scoreLead } from "../server/core/scoringEngine.js";

const version = {
  id: "scorever_2026_q2",
  clientId: "client_real_estate",
  name: "Real estate initial",
  active: true
};

describe("scoreLead", () => {
  it("calculates a qualified score from weighted matching rules", () => {
    const lead = {
      industry: "real_estate",
      companySize: "11-50",
      budget: 18000,
      urgency: "high",
      location: "Florida",
      sourceQuality: "partner_referral",
      customFields: {
        propertyCount: 42
      }
    };
    const rules = [
      rule("industry", "equals", "real_estate", 30, "Industry fit"),
      rule("companySize", "in", ["11-50", "51-200"], 15, "Team size fit"),
      rule("budget", "greaterThanOrEqual", 15000, 20, "Budget fit"),
      rule("urgency", "equals", "high", 15, "Urgency fit"),
      rule("customFields.propertyCount", "greaterThanOrEqual", 25, 5, "Portfolio size")
    ];

    const result = scoreLead(lead, rules, version);

    expect(result.finalScore).toBe(85);
    expect(result.tier).toBe("qualified");
    expect(result.scoringRuleVersionId).toBe(version.id);
    expect(result.matchedRules).toHaveLength(5);
    expect(result.missedCriteria).toEqual([]);
  });

  it("returns review tier with matched and missed criteria", () => {
    const lead = {
      industry: "plumbing",
      companySize: "1-10",
      budget: 7000,
      urgency: "medium",
      location: "Ohio",
      sourceQuality: "web_form"
    };
    const rules = [
      rule("industry", "equals", "plumbing", 25, "Industry fit"),
      rule("budget", "greaterThanOrEqual", 10000, 20, "Budget fit"),
      rule("urgency", "in", ["high", "emergency"], 20, "Urgency fit")
    ];

    const result = scoreLead(lead, rules, version);

    expect(result.finalScore).toBe(25);
    expect(result.tier).toBe("nurture");
    expect(result.matchedRules).toEqual([{ id: "rule_industry", label: "Industry fit", points: 25 }]);
    expect(result.missedCriteria).toEqual([
      { id: "rule_budget", label: "Budget fit", expected: 10000, actual: 7000 },
      { id: "rule_urgency", label: "Urgency fit", expected: ["high", "emergency"], actual: "medium" }
    ]);
  });

  it("keeps the supplied scoring rule version id on historical results", () => {
    const previousVersion = { ...version, id: "scorever_previous" };
    const currentVersion = { ...version, id: "scorever_current" };
    const lead = { industry: "law_firm", budget: 22000 };

    const historicalResult = scoreLead(lead, [rule("industry", "equals", "law_firm", 50, "Legal fit")], previousVersion);
    const currentResult = scoreLead(lead, [rule("budget", "greaterThan", 20000, 40, "Budget fit")], currentVersion);

    expect(historicalResult.scoringRuleVersionId).toBe("scorever_previous");
    expect(historicalResult.finalScore).toBe(50);
    expect(currentResult.scoringRuleVersionId).toBe("scorever_current");
    expect(currentResult.finalScore).toBe(40);
  });
});

function rule(field, operator, value, points, label) {
  return {
    id: `rule_${field.split(".").at(-1)}`,
    field,
    operator,
    value,
    points,
    label
  };
}
