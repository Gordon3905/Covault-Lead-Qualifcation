import "dotenv/config";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./database.js";
import { demoVerticals } from "./seedData.js";
import { processLead } from "../core/leadPipeline.js";
import { createRepositories } from "../repositories/index.js";

const demoTables = [
  "adapter_events",
  "audit_events",
  "route_decisions",
  "round_robin_cursors",
  "ai_assessments",
  "scoring_results",
  "lead_custom_fields",
  "leads",
  "nurture_sequences",
  "territory_rules",
  "territory_rule_versions",
  "scoring_rules",
  "scoring_rule_versions",
  "reps",
  "teams",
  "email_deliveries",
  "customer_users",
  "provider_settings",
  "clients"
];

export async function seedDemoData(db = createDatabase()) {
  resetDemoData(db);
  const repos = createRepositories(db);

  for (const vertical of demoVerticals) {
    const { client } = createClientFromVertical({ db, repos, vertical, companyName: vertical.name, slug: vertical.slug });

    for (const sampleLead of vertical.sampleLeads) {
      await processLead({
        clientSlug: vertical.slug,
        source: sampleLead.sourceQuality,
        payload: sampleLead,
        repos
      });
    }
  }
}

export function createClientFromVertical({ db, repos, vertical, companyName, slug }) {
  const client = repos.clients.create({ name: companyName, slug });
  const teams = vertical.teams.map((name) => repos.teams.createTeam({ clientId: client.id, name }));
  vertical.reps.forEach((name, index) => {
    repos.teams.createRep({
      clientId: client.id,
      teamId: teams[index % teams.length].id,
      name,
      email: `${slugify(name)}@${slug}.example`
    });
  });

  createScoringConfig(repos, client, vertical);
  createTerritoryConfig(repos, client, vertical, teams);
  createProviderSettings(repos, client);
  createNurtureSequence(db, client, vertical, slug);

  return { client, teams };
}

function resetDemoData(db) {
  const reset = db.transaction(() => {
    db.pragma("foreign_keys = OFF");
    for (const table of demoTables) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    db.pragma("foreign_keys = ON");
  });
  reset();
}

function createScoringConfig(repos, client, vertical) {
  const version = repos.rules.createScoringVersion({ clientId: client.id, name: "Demo scoring", active: true });
  const rules = [
    ["industry", "equals", vertical.industry, 35, "Industry fit"],
    ["budget", "greaterThanOrEqual", 15000, 30, "Budget fit"],
    ["urgency", "equals", "high", 20, "Urgency fit"],
    ["region", "in", vertical.regions, 15, "Territory fit"],
    ["sourceQuality", "in", ["partner_referral", "emergency_form", "web_form"], 10, "Source quality"]
  ];

  for (const [field, operator, value, points, label] of rules) {
    repos.rules.addScoringRule({ scoringRuleVersionId: version.id, field, operator, value, points, label });
  }
}

function createTerritoryConfig(repos, client, vertical, teams) {
  const version = repos.rules.createTerritoryVersion({ clientId: client.id, name: "Demo territories", active: true });
  repos.rules.addTerritoryRule({
    territoryRuleVersionId: version.id,
    name: `${vertical.regions[0]} ${vertical.teams[0]}`,
    priority: 10,
    teamId: teams[0].id,
    conditions: [
      { field: "industry", operator: "equals", value: vertical.industry },
      { field: "region", operator: "equals", value: vertical.regions[0] }
    ]
  });
  repos.rules.addTerritoryRule({
    territoryRuleVersionId: version.id,
    name: `${vertical.regions[1]} ${vertical.teams[1]}`,
    priority: 8,
    teamId: teams[1].id,
    conditions: [
      { field: "industry", operator: "equals", value: vertical.industry },
      { field: "region", operator: "equals", value: vertical.regions[1] }
    ]
  });
}

function createProviderSettings(repos, client) {
  repos.providers.upsert({ clientId: client.id, providerKey: "ai", category: "ai", mode: "mock", enabled: true });
  repos.providers.upsert({ clientId: client.id, providerKey: "sales-notification", category: "notification", mode: "mock", enabled: true });
  repos.providers.upsert({ clientId: client.id, providerKey: "nurture", category: "nurture", mode: "mock", enabled: true });
  repos.providers.upsert({ clientId: client.id, providerKey: "crm", category: "crm", mode: "mock", enabled: true });
}

function createNurtureSequence(db, client, vertical, slug = vertical.slug) {
  db.prepare(`
    INSERT INTO nurture_sequences (id, client_id, name, trigger_tier, steps_json, active, created_at)
    VALUES (@id, @clientId, @name, 'nurture', @stepsJson, 1, @createdAt)
  `).run({
    id: `nurture_${slug}`,
    clientId: client.id,
    name: vertical.nurture,
    stepsJson: JSON.stringify([
      { day: 0, channel: "email", subject: "Thanks for reaching out" },
      { day: 3, channel: "email", subject: "What strong-fit teams do next" },
      { day: 10, channel: "sms", subject: "Still exploring options?" }
    ]),
    createdAt: new Date().toISOString()
  });
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await seedDemoData();
  console.log("Seeded CoVault demo data for real estate, plumbing, law firm, and medical practice.");
}
