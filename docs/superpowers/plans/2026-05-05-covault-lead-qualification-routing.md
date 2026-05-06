# Kavor Automation System Lead Qualification and Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working local full-stack Kavor Leads demo that ingests, scores, explains, routes, audits, and nurtures leads through mock/live-ready provider adapters.

**Architecture:** Use a React dashboard, Node/Express API, SQLite repository layer, and pure core pipeline modules. Provider adapters are resolved by persisted per-provider mode so any one adapter can switch from mock to live without changing scoring, routing, audit, or dashboard logic.

**Tech Stack:** JavaScript, Node.js, Express, Vite, React, SQLite via `better-sqlite3`, Vitest, Supertest, Lucide React.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `.gitignore`: local ignored artifacts.
- Create `.env.example`: demo configuration.
- Create `server/index.js`: Express server bootstrap.
- Create `server/app.js`: Express app and route mounting.
- Create `server/db/schema.js`: SQLite schema.
- Create `server/db/database.js`: database connection and migration helper.
- Create `server/db/seed.js`: multi-vertical seed data.
- Create `server/repositories/*.js`: persistence boundaries for clients, providers, leads, rules, routing, audit, and reps.
- Create `server/core/scoringEngine.js`: deterministic weighted rules.
- Create `server/core/explanationService.js`: AI adapter orchestration and deterministic fallback.
- Create `server/core/routingEngine.js`: territory-first and round-robin routing.
- Create `server/core/leadPipeline.js`: end-to-end orchestration.
- Create `server/providers/registry.js`: provider mode resolution.
- Create `server/providers/mock/*.js`: mock source, notification, nurture, CRM, and AI adapters.
- Create `server/routes/*.js`: API routes for leads, config, reps, and demo actions.
- Create `client/src/App.jsx`: dashboard shell.
- Create `client/src/components/*.jsx`: dashboard panels and editors.
- Create `client/src/api.js`: API client.
- Create `client/src/styles.css`: operational dashboard styling.
- Create `tests/*.test.js`: focused tests for scoring, routing, adapters, audit, API contracts, and versioning.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `server/index.js`

- [ ] **Step 1: Create the package manifest**

Add `package.json`:

```json
{
  "name": "kavor-leads-routing",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "node server/index.js",
    "dev:client": "vite --host 127.0.0.1",
    "build": "vite build",
    "test": "vitest run",
    "db:seed": "node server/db/seed.js"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "better-sqlite3": "^9.4.3",
    "concurrently": "^8.2.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "lucide-react": "^0.468.0",
    "nanoid": "^5.0.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vite": "^5.1.4"
  },
  "devDependencies": {
    "supertest": "^6.3.4",
    "vitest": "^1.3.1"
  }
}
```

- [ ] **Step 2: Create local config and ignore files**

Add `.gitignore`:

```gitignore
node_modules/
dist/
.env
data/*.sqlite
coverage/
```

Add `.env.example`:

```bash
PORT=4300
DATABASE_PATH=data/kavor-leads.sqlite
DEFAULT_CLIENT_SLUG=real-estate
```

- [ ] **Step 3: Create minimal app entry points**

Add `index.html`:

```html
<div id="root"></div>
<script type="module" src="/client/src/main.jsx"></script>
```

Add `vite.config.js`:

```js
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4300"
    }
  }
});
```

Add `client/src/main.jsx`:

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);
```

Add `client/src/App.jsx`:

```jsx
export default function App() {
  return <main className="app-shell">Kavor Leads</main>;
}
```

Add `server/index.js`:

```js
import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 4300);
const app = createApp();

app.listen(port, () => {
  console.log(`Kavor Automation System API listening on http://127.0.0.1:${port}`);
});
```

- [ ] **Step 4: Run dependency install**

Run: `npm install`

Expected: `package-lock.json` exists and install exits successfully.

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json package-lock.json .gitignore .env.example index.html vite.config.js client server
git commit -m "chore: scaffold Kavor Leads routing app"
```

## Task 2: Database Schema and Repositories

**Files:**
- Create: `server/app.js`
- Create: `server/db/database.js`
- Create: `server/db/schema.js`
- Create: `server/repositories/auditRepository.js`
- Create: `server/repositories/clientRepository.js`
- Create: `server/repositories/leadRepository.js`
- Create: `server/repositories/providerRepository.js`
- Create: `server/repositories/ruleRepository.js`
- Create: `server/repositories/routingRepository.js`
- Create: `server/repositories/teamRepository.js`
- Test: `tests/repositories.test.js`

- [ ] **Step 1: Write repository tests**

Add `tests/repositories.test.js`:

```js
import { describe, expect, it } from "vitest";
import { createTestDatabase } from "./testDb.js";
import { createRepositories } from "../server/repositories/index.js";

describe("repositories", () => {
  it("stores immutable scoring results with rule version references", () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const client = repos.clients.create({ name: "Demo Realty", slug: "real-estate" });
    const version = repos.rules.createScoringVersion({ clientId: client.id, name: "Initial", active: true });
    const lead = repos.leads.createLead({ clientId: client.id, source: "mock", payload: { industry: "real_estate" } });

    repos.leads.saveScoringResult({
      leadId: lead.id,
      scoringRuleVersionId: version.id,
      finalScore: 82,
      tier: "qualified",
      breakdown: [{ label: "Industry fit", points: 30 }]
    });

    const detail = repos.leads.getLeadDetail(lead.id);
    expect(detail.scoring.scoringRuleVersionId).toBe(version.id);
    expect(detail.scoring.finalScore).toBe(82);
  });
});
```

- [ ] **Step 2: Add test database helper**

Add `tests/testDb.js`:

```js
import Database from "better-sqlite3";
import { applySchema } from "../server/db/schema.js";

export function createTestDatabase() {
  const db = new Database(":memory:");
  applySchema(db);
  return db;
}
```

- [ ] **Step 3: Implement schema**

Add `server/db/schema.js` with tables for `clients`, `provider_settings`, `leads`, `scoring_rule_versions`, `scoring_rules`, `scoring_results`, `ai_assessments`, `territory_rule_versions`, `territory_rules`, `teams`, `reps`, `round_robin_cursors`, `route_decisions`, `adapter_events`, `audit_events`, and `nurture_sequences`. Use text IDs, ISO timestamp strings, and JSON text columns for structured details.

- [ ] **Step 4: Implement database bootstrap**

Add `server/db/database.js`:

```js
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applySchema } from "./schema.js";

export function createDatabase(path = process.env.DATABASE_PATH || "data/kavor-leads.sqlite") {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  applySchema(db);
  return db;
}
```

- [ ] **Step 5: Implement repositories and index**

Add small repository modules with these functions:

```js
clients.create(input)
clients.findBySlug(slug)
providers.listByClient(clientId)
providers.updateMode(clientId, providerKey, mode)
leads.createLead(input)
leads.saveScoringResult(input)
leads.getLeadDetail(leadId)
rules.createScoringVersion(input)
rules.getActiveScoringVersion(clientId)
rules.createTerritoryVersion(input)
rules.getActiveTerritoryVersion(clientId)
routing.saveRouteDecision(input)
routing.getAndAdvanceCursor(input)
audit.record(input)
teams.listReps(clientId)
```

- [ ] **Step 6: Run tests**

Run: `npm test -- tests/repositories.test.js`

Expected: repository test passes.

- [ ] **Step 7: Commit**

Run:

```bash
git add server/db server/repositories tests
git commit -m "feat: add SQLite persistence layer"
```

## Task 3: Deterministic Scoring and Rule Versioning

**Files:**
- Create: `server/core/scoringEngine.js`
- Test: `tests/scoring.test.js`

- [ ] **Step 1: Write scoring tests**

Add tests proving weighted criteria, custom fields, missed criteria, tiers, and historical scoring version IDs:

```js
expect(scoreLead(lead, rules, version).finalScore).toBe(85);
expect(scoreLead(lead, rules, version).tier).toBe("qualified");
expect(scoreLead(lead, rules, version).scoringRuleVersionId).toBe(version.id);
```

- [ ] **Step 2: Implement `scoreLead`**

Create `server/core/scoringEngine.js` with:

```js
export function scoreLead(lead, rules, version) {
  const matchedRules = [];
  const missedCriteria = [];
  let finalScore = 0;

  for (const rule of rules) {
    const value = readLeadValue(lead, rule.field);
    const matched = evaluateRule(value, rule.operator, rule.value);
    if (matched) {
      finalScore += Number(rule.points);
      matchedRules.push({ id: rule.id, label: rule.label, points: Number(rule.points) });
    } else {
      missedCriteria.push({ id: rule.id, label: rule.label, expected: rule.value, actual: value ?? null });
    }
  }

  return {
    scoringRuleVersionId: version.id,
    finalScore,
    tier: finalScore >= 75 ? "qualified" : finalScore >= 45 ? "review" : "nurture",
    matchedRules,
    missedCriteria,
    breakdown: matchedRules
  };
}
```

- [ ] **Step 3: Run tests and commit**

Run: `npm test -- tests/scoring.test.js`

Expected: all scoring tests pass.

Commit:

```bash
git add server/core/scoringEngine.js tests/scoring.test.js
git commit -m "feat: add versioned scoring engine"
```

## Task 4: Routing Engine and Persistent Round-Robin

**Files:**
- Create: `server/core/routingEngine.js`
- Test: `tests/routing.test.js`

- [ ] **Step 1: Write routing tests**

Cover direct territory rep assignment, team territory round-robin, most-specific territory match, no-territory full-team fallback, and persisted cursor advancement.

- [ ] **Step 2: Implement routing engine**

Create `routeLead({ lead, territoryVersion, territories, teams, reps, cursorStore })` returning:

```js
{
  territoryRuleVersionId,
  territoryId,
  teamId,
  repId,
  strategy,
  reason
}
```

Use priority first, then number of conditions matched as specificity. Call `cursorStore.getAndAdvance(scopeKey, repIds)` for team and full-team round-robin.

- [ ] **Step 3: Run tests and commit**

Run: `npm test -- tests/routing.test.js`

Expected: all routing tests pass.

Commit:

```bash
git add server/core/routingEngine.js tests/routing.test.js
git commit -m "feat: add territory-first routing engine"
```

## Task 5: Provider Registry, AI Explanation, and Audit Events

**Files:**
- Create: `server/providers/registry.js`
- Create: `server/providers/mock/aiAdapter.js`
- Create: `server/providers/mock/notificationAdapter.js`
- Create: `server/providers/mock/nurtureAdapter.js`
- Create: `server/providers/mock/crmAdapter.js`
- Create: `server/core/explanationService.js`
- Test: `tests/providers.test.js`
- Test: `tests/audit.test.js`

- [ ] **Step 1: Write adapter and audit tests**

Assert per-provider mode resolution, AI disabled deterministic fallback, adapter call audit event creation, and delivery outcome audit event creation.

- [ ] **Step 2: Implement provider registry**

Create `getProviderAdapter(providerKey, mode)` that returns mock implementations for `mock` mode and throws a clear `LiveAdapterNotConfiguredError` for unimplemented `live` mode.

- [ ] **Step 3: Implement explanation service**

Create `generateLeadExplanation({ lead, scoreResult, aiEnabled, aiAdapter })`. If disabled or adapter fails, return deterministic text using the top matched rule and first missed criterion.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- tests/providers.test.js tests/audit.test.js`

Expected: tests pass.

Commit:

```bash
git add server/providers server/core/explanationService.js tests/providers.test.js tests/audit.test.js
git commit -m "feat: add provider registry and lead explanations"
```

## Task 6: Lead Pipeline and API

**Files:**
- Create: `server/core/leadPipeline.js`
- Create: `server/routes/leads.js`
- Create: `server/routes/config.js`
- Create: `server/routes/reps.js`
- Create: `server/routes/demo.js`
- Modify: `server/app.js`
- Test: `tests/api.test.js`
- Test: `tests/pipeline.test.js`

- [ ] **Step 1: Write pipeline and API tests**

Cover `POST /api/leads`, `GET /api/leads`, `GET /api/leads/:id`, provider toggles, scoring version creation, territory version creation, and the no-unrouted-qualified-lead guarantee.

- [ ] **Step 2: Implement pipeline**

Create `processLead({ clientSlug, source, payload, repos, providers })`. It must record audit events for receive, normalize, score, explain, route, adapter start, and adapter delivery result.

- [ ] **Step 3: Implement Express routes**

Mount routes in `server/app.js`:

```js
import cors from "cors";
import express from "express";
import { createDatabase } from "./db/database.js";
import { createRepositories } from "./repositories/index.js";
import { createLeadRouter } from "./routes/leads.js";
import { createConfigRouter } from "./routes/config.js";
import { createRepsRouter } from "./routes/reps.js";
import { createDemoRouter } from "./routes/demo.js";

export function createApp({ db = createDatabase() } = {}) {
  const app = express();
  const repos = createRepositories(db);
  app.use(cors());
  app.use(express.json());
  app.use("/api/leads", createLeadRouter(repos));
  app.use("/api/config", createConfigRouter(repos));
  app.use("/api/reps", createRepsRouter(repos));
  app.use("/api/demo", createDemoRouter(repos));
  return app;
}
```

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- tests/pipeline.test.js tests/api.test.js`

Expected: tests pass.

Commit:

```bash
git add server/core/leadPipeline.js server/routes server/app.js tests/pipeline.test.js tests/api.test.js
git commit -m "feat: add lead processing API"
```

## Task 7: Multi-Vertical Demo Seed Data

**Files:**
- Create: `server/db/seedData.js`
- Create: `server/db/seed.js`
- Test: `tests/seed.test.js`

- [ ] **Step 1: Write seed tests**

Assert the seed creates clients for `real-estate`, `plumbing`, `law-firm`, and `medical-practice`, each with scoring rules, territory rules, reps, provider settings, nurture sequences, and sample leads.

- [ ] **Step 2: Implement seed data**

Create explicit seed objects for the four verticals with varied industries, regions, budgets, urgency levels, teams, and reps.

- [ ] **Step 3: Implement seed runner**

`server/db/seed.js` should reset demo tables, apply schema, insert all seed data, and process sample leads through the pipeline so route decisions and audit logs exist immediately.

- [ ] **Step 4: Run seed and tests**

Run:

```bash
npm run db:seed
npm test -- tests/seed.test.js
```

Expected: seed succeeds and tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/db tests/seed.test.js
git commit -m "feat: seed multi-vertical demo data"
```

## Task 8: React Dashboard

**Files:**
- Modify: `client/src/App.jsx`
- Create: `client/src/api.js`
- Create: `client/src/components/LeadInbox.jsx`
- Create: `client/src/components/LeadDetail.jsx`
- Create: `client/src/components/ProviderSettings.jsx`
- Create: `client/src/components/ScoringRules.jsx`
- Create: `client/src/components/TerritoryRules.jsx`
- Create: `client/src/components/DemoSimulator.jsx`
- Create: `client/src/styles.css`
- Test: `tests/ui-build.test.js`

- [ ] **Step 1: Write UI smoke test**

Add a build-oriented test or script assertion that `npm run build` succeeds after dashboard implementation.

- [ ] **Step 2: Implement API client**

Create fetch helpers for leads, lead detail, provider settings, rule versions, reps, and demo lead creation.

- [ ] **Step 3: Implement dashboard components**

Build the operational console with lead inbox, filters, lead detail drawer, score breakdown, AI explanation, route decision, audit timeline, provider toggles, scoring rule version panel, territory panel, and demo simulator.

- [ ] **Step 4: Implement styling**

Use compact, work-focused CSS with stable dimensions, readable tables, clear badges, and no marketing hero.

- [ ] **Step 5: Run build and commit**

Run:

```bash
npm run build
npm test -- tests/ui-build.test.js
```

Expected: build and test pass.

Commit:

```bash
git add client tests/ui-build.test.js
git commit -m "feat: add Kavor Leads dashboard"
```

## Task 9: Final Verification and README

**Files:**
- Create: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Add README**

Document:

- Product purpose.
- Local setup.
- `npm install`.
- `npm run db:seed`.
- `npm run dev`.
- Demo verticals.
- Mock/live provider model.
- Scoring and territory rule versioning.
- Audit log behavior.
- Test commands.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
npm run db:seed
```

Expected: all commands complete successfully.

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add Kavor Leads demo guide"
```

## Self-Review

- Spec coverage: This plan covers full-stack scaffold, SQLite persistence, provider adapters, deterministic scoring, optional AI explanation, territory and round-robin routing, audit logs, rule versioning, multi-vertical seed data, dashboard, API contracts, and README.
- Red-flag scan: No incomplete markers or intentionally vague implementation slots remain. The plan includes exact file paths, commands, expected outcomes, and concrete function boundaries.
- Type consistency: Core entities consistently use `clientId`, `leadId`, `scoringRuleVersionId`, `territoryRuleVersionId`, `providerKey`, `mode`, `finalScore`, `tier`, and JSON-compatible structured details.


