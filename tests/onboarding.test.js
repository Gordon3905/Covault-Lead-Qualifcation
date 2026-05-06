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

  it("seeds visible demo leads and returns a dashboard URL for a new signup", async () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const app = createApp({ db, repos });

    const response = await request(app)
      .post("/api/onboarding/signup")
      .send({
        vertical: "medical-practice",
        email: "owner@freshspa.example",
        companyName: "Fresh Spa"
      })
      .expect(201);

    expect(response.body.dashboardUrl).toBe("http://127.0.0.1:5173/?clientSlug=fresh-spa");
    expect(response.body.credentials).toMatchObject({
      email: "owner@freshspa.example"
    });

    const leads = await request(app).get("/api/leads?clientSlug=fresh-spa").expect(200);
    expect(leads.body.leads).toHaveLength(3);
    expect(leads.body.leads[0].scoring).toEqual(expect.objectContaining({ tier: expect.any(String) }));
  });

  it("returns an existing workspace for duplicate signup emails without creating duplicate users", async () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const app = createApp({ db, repos });
    const signup = {
      vertical: "medical-practice",
      email: "owner@glow.example",
      companyName: "Glow House Med Spa"
    };

    const first = await request(app).post("/api/onboarding/signup").send(signup).expect(201);
    const second = await request(app).post("/api/onboarding/signup").send(signup).expect(200);

    expect(second.body.client.slug).toBe(first.body.client.slug);
    expect(second.body.dashboardUrl).toBe(first.body.dashboardUrl);
    expect(second.body.credentials.password).toMatch(/^Kavor-/);

    const users = db.prepare("SELECT * FROM customer_users WHERE email = ?").all("owner@glow.example");
    expect(users).toHaveLength(1);
    expect(users[0].password_hash).not.toBe(first.body.credentials.password);
    expect(users[0].password_hash).not.toBe(second.body.credentials.password);

    const matchingIndexes = db
      .prepare("PRAGMA index_list('customer_users')")
      .all()
      .filter((index) => index.unique === 1);
    expect(matchingIndexes.length).toBeGreaterThanOrEqual(1);
  });
});
