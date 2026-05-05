import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("operations dashboard source", () => {
  it("wires the live demo simulator and core dashboard panels", () => {
    const app = readFileSync("client/src/App.jsx", "utf8");
    const api = readFileSync("client/src/api.js", "utf8");

    expect(app).toContain("DemoSimulator");
    expect(app).toContain("LeadInbox");
    expect(app).toContain("LeadDetail");
    expect(app).toContain("ProviderSettings");
    expect(app).toContain("ScoringRules");
    expect(app).toContain("TerritoryRules");
    expect(api).toContain("createDemoLead");
    expect(api).toContain("/api/demo/leads");
  });
});
