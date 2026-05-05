import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";
import { seedPipelineConfig } from "./pipelineFixture.js";

describe("API", () => {
  it("processes a qualified lead without leaving it unrouted", async () => {
    const { repos } = seedPipelineConfig();
    const app = createApp({ repos });

    const response = await request(app)
      .post("/api/leads")
      .send({
        clientSlug: "pipeline-medical",
        source: "webhook",
        payload: {
          name: "Parker Medical",
          industry: "medical_practice",
          budget: 24000,
          urgency: "high",
          region: "Northeast"
        }
      })
      .expect(201);

    expect(response.body.scoring.tier).toBe("qualified");
    expect(response.body.route.repId).toEqual(expect.any(String));
    expect(response.body.auditEventCount).toBeGreaterThanOrEqual(10);
  });

  it("lists leads and returns lead detail with score, route, explanation, and audit", async () => {
    const { repos } = seedPipelineConfig();
    const app = createApp({ repos });

    const created = await request(app)
      .post("/api/leads")
      .send({
        clientSlug: "pipeline-medical",
        source: "webhook",
        payload: {
          name: "Parker Medical",
          industry: "medical_practice",
          budget: 24000,
          urgency: "high",
          region: "Northeast"
        }
      });

    const list = await request(app).get("/api/leads?clientSlug=pipeline-medical").expect(200);
    expect(list.body.leads).toHaveLength(1);
    expect(list.body.leads[0].scoring).toMatchObject({ finalScore: 90, tier: "qualified" });

    const detail = await request(app).get(`/api/leads/${created.body.lead.id}`).expect(200);
    expect(detail.body.lead.scoring.finalScore).toBe(90);
    expect(detail.body.lead.route.repId).toEqual(expect.any(String));
    expect(detail.body.lead.aiAssessments[0].explanation).toContain("Parker Medical");
    expect(detail.body.lead.auditEvents.length).toBeGreaterThanOrEqual(10);
  });

  it("toggles provider modes and creates new rule versions", async () => {
    const { repos } = seedPipelineConfig();
    const app = createApp({ repos });

    const provider = await request(app)
      .patch("/api/config/providers/sales-notification")
      .send({ clientSlug: "pipeline-medical", mode: "live" })
      .expect(200);
    expect(provider.body.provider.mode).toBe("live");

    const scoring = await request(app)
      .post("/api/config/scoring/versions")
      .send({
        clientSlug: "pipeline-medical",
        name: "Revised scoring",
        rules: [{ field: "budget", operator: "greaterThan", value: 20000, points: 50, label: "Large budget" }]
      })
      .expect(201);
    expect(scoring.body.version.active).toBe(true);

    const territory = await request(app)
      .post("/api/config/territories/versions")
      .send({
        clientSlug: "pipeline-medical",
        name: "Revised territories",
        rules: [{ name: "All medical", priority: 1, conditions: [{ field: "industry", operator: "equals", value: "medical_practice" }] }]
      })
      .expect(201);
    expect(territory.body.version.active).toBe(true);
  });
});
