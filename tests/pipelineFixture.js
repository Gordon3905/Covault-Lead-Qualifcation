import { createRepositories } from "../server/repositories/index.js";
import { createTestDatabase } from "./testDb.js";

export function seedPipelineConfig() {
  const db = createTestDatabase();
  const repos = createRepositories(db);
  const client = repos.clients.create({ name: "Pipeline Medical", slug: "pipeline-medical" });
  const team = repos.teams.createTeam({ clientId: client.id, name: "Medical Team" });
  repos.teams.createRep({ clientId: client.id, teamId: team.id, name: "Mia", email: "mia@example.com" });
  repos.teams.createRep({ clientId: client.id, teamId: team.id, name: "Eli", email: "eli@example.com" });
  const reps = repos.teams.listReps(client.id);
  const scoringVersion = repos.rules.createScoringVersion({ clientId: client.id, name: "Initial scoring", active: true });
  repos.rules.addScoringRule({
    scoringRuleVersionId: scoringVersion.id,
    field: "industry",
    operator: "equals",
    value: "medical_practice",
    points: 35,
    label: "Industry fit"
  });
  repos.rules.addScoringRule({
    scoringRuleVersionId: scoringVersion.id,
    field: "budget",
    operator: "greaterThanOrEqual",
    value: 15000,
    points: 30,
    label: "Budget fit"
  });
  repos.rules.addScoringRule({
    scoringRuleVersionId: scoringVersion.id,
    field: "urgency",
    operator: "equals",
    value: "high",
    points: 25,
    label: "Urgency fit"
  });

  const territoryVersion = repos.rules.createTerritoryVersion({ clientId: client.id, name: "Initial territories", active: true });
  repos.rules.addTerritoryRule({
    territoryRuleVersionId: territoryVersion.id,
    name: "Medical Northeast",
    priority: 10,
    teamId: team.id,
    conditions: [
      { field: "industry", operator: "equals", value: "medical_practice" },
      { field: "region", operator: "equals", value: "Northeast" }
    ]
  });

  repos.providers.upsert({ clientId: client.id, providerKey: "ai", category: "ai", mode: "mock", enabled: true });
  repos.providers.upsert({
    clientId: client.id,
    providerKey: "sales-notification",
    category: "notification",
    mode: "mock",
    enabled: true
  });
  repos.providers.upsert({ clientId: client.id, providerKey: "nurture", category: "nurture", mode: "mock", enabled: true });

  return { repos, client, team, reps, scoringVersion, territoryVersion };
}
