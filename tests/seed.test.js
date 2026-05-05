import { describe, expect, it } from "vitest";
import { seedDemoData } from "../server/db/seed.js";
import { createTestDatabase } from "./testDb.js";

const verticals = ["real-estate", "plumbing", "law-firm", "medical-practice"];

describe("seedDemoData", () => {
  it("resets and seeds all demo verticals with config and processed sample leads", async () => {
    const db = createTestDatabase();

    await seedDemoData(db);
    await seedDemoData(db);

    for (const slug of verticals) {
      const client = db.prepare("SELECT * FROM clients WHERE slug = ?").get(slug);
      expect(client, `${slug} client`).toBeTruthy();

      expect(count(db, "scoring_rule_versions", client.id)).toBe(1);
      expect(countRules(db, "scoring_rules", "scoring_rule_versions", client.id)).toBeGreaterThanOrEqual(5);
      expect(count(db, "territory_rule_versions", client.id)).toBe(1);
      expect(countRules(db, "territory_rules", "territory_rule_versions", client.id)).toBeGreaterThanOrEqual(2);
      expect(count(db, "teams", client.id)).toBeGreaterThanOrEqual(2);
      expect(count(db, "reps", client.id)).toBeGreaterThanOrEqual(3);
      expect(count(db, "provider_settings", client.id)).toBeGreaterThanOrEqual(3);
      expect(count(db, "nurture_sequences", client.id)).toBeGreaterThanOrEqual(1);
      expect(count(db, "leads", client.id)).toBe(3);
      expect(count(db, "scoring_results", client.id, "leads")).toBe(3);
      expect(count(db, "audit_events", client.id)).toBeGreaterThanOrEqual(20);
    }

    expect(db.prepare("SELECT COUNT(*) AS total FROM clients").get().total).toBe(4);
  });
});

function count(db, table, clientId, joinTable = null) {
  if (joinTable) {
    return db
      .prepare(`SELECT COUNT(*) AS total FROM ${table} INNER JOIN ${joinTable} ON ${table}.lead_id = ${joinTable}.id WHERE ${joinTable}.client_id = ?`)
      .get(clientId).total;
  }

  return db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE client_id = ?`).get(clientId).total;
}

function countRules(db, table, versionTable, clientId) {
  const foreignKey = versionTable === "scoring_rule_versions" ? "scoring_rule_version_id" : "territory_rule_version_id";
  return db
    .prepare(
      `SELECT COUNT(*) AS total FROM ${table} INNER JOIN ${versionTable} ON ${table}.${foreignKey} = ${versionTable}.id WHERE ${versionTable}.client_id = ?`
    )
    .get(clientId).total;
}
