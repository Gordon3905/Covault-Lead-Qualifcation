import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";
import { createRepositories } from "../server/repositories/index.js";
import { createTestDatabase } from "./testDb.js";

describe("self-serve onboarding", () => {
  it("creates a configured client, generated credentials, and a dashboard email", async () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const app = createApp({ db, repos });

    const response = await request(app)
      .post("/api/onboarding/signup")
      .send({
        vertical: "plumbing",
        email: "owner@bluepipe.example",
        companyName: "Blue Pipe Pros"
      })
      .expect(201);

    expect(response.body.client).toMatchObject({
      name: "Blue Pipe Pros",
      slug: "blue-pipe-pros"
    });
    expect(response.body.credentials).toMatchObject({
      email: "owner@bluepipe.example"
    });
    expect(response.body.credentials.password).toEqual(expect.any(String));
    expect(response.body.dashboardUrl).toContain("clientSlug=blue-pipe-pros");

    const client = repos.clients.findBySlug("blue-pipe-pros");
    expect(repos.rules.getActiveScoringVersion(client.id)).toEqual(expect.objectContaining({ active: true }));
    expect(repos.rules.getActiveTerritoryVersion(client.id)).toEqual(expect.objectContaining({ active: true }));
    expect(repos.teams.listReps(client.id)).toHaveLength(3);
    expect(repos.providers.listByClient(client.id).map((provider) => provider.providerKey).sort()).toEqual([
      "ai",
      "crm",
      "nurture",
      "sales-notification"
    ].sort());

    const user = db.prepare("SELECT * FROM customer_users WHERE client_id = ?").get(client.id);
    expect(user.email).toBe("owner@bluepipe.example");
    expect(user.password_hash).not.toBe(response.body.credentials.password);

    const email = db.prepare("SELECT * FROM email_deliveries WHERE client_id = ?").get(client.id);
    expect(email.recipient_email).toBe("owner@bluepipe.example");
    expect(email.body).toContain(response.body.credentials.password);
    expect(email.body).toContain(response.body.dashboardUrl);
  });
});
