import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("lead demo dashboard source", () => {
  it("wires the simplified lead demo flow", () => {
    const app = readFileSync("client/src/App.jsx", "utf8");
    const api = readFileSync("client/src/api.js", "utf8");

    expect(app).toContain("DemoSimulator");
    expect(app).toContain("LeadInbox");
    expect(app).toContain("LeadDetail");
    expect(app).toContain("Drop in a lead. CoVault decides what happens next.");
    expect(app).toContain("Ready for sales");
    expect(app).toContain("Sent to nurture");
    expect(app).toContain("SignupFlow");
    expect(api).toContain("createDemoLead");
    expect(api).toContain("/api/demo/leads");
  });
});
