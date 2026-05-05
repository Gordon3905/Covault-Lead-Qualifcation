# CoVault Lead Qualification and Routing

CoVault is a full-stack JavaScript demo app for lead intake, qualification, routing, and nurture automation. It ingests incoming leads, scores them with client-configurable weighted rules, generates a short explanation, routes qualified prospects to sales reps, and sends cold leads into nurture.

The demo is built to behave like a real product: SQLite persistence, versioned scoring and territory rules, provider adapter mode toggles, round-robin cursor persistence, and a full audit trail for every processed lead.

## Local Setup

```bash
npm install
npm run db:seed
npm run dev
```

The app runs with:

- API: `http://127.0.0.1:4300`
- Dashboard: `http://127.0.0.1:5173`

Use the dashboard to switch verticals, inspect existing seeded leads, and trigger a fresh demo lead from the simulator panel.

## Demo Verticals

The seed command creates four complete demo clients:

- Real estate
- Plumbing
- Law firm
- Medical practice

Each vertical includes scoring rules, territory rules, teams, reps, provider settings, a nurture sequence, and three sample leads processed through the real pipeline.

`npm run db:seed` resets and reseeds cleanly every time, so repeated sales demos do not accumulate duplicate data.

## Mock And Live Provider Model

Providers are resolved through adapter settings stored in the database. Each provider can be toggled between `mock` and `live` independently without changing the core scoring or routing logic.

Current mock adapters:

- AI assessment
- Sales notification
- Nurture enrollment
- CRM sync

Live adapters intentionally throw a clear `LiveAdapterNotConfiguredError` until real provider credentials and implementation are added.

## Scoring Rules

Scoring is deterministic and rule-driven. The rules engine evaluates weighted criteria such as:

- Industry
- Company size
- Budget
- Urgency
- Region
- Source quality
- Custom fields

Scoring results store the scoring rule version used, final score, tier, matched rules, missed criteria, and score breakdown. Existing leads keep their original scoring result when rules change.

## Territory Routing

Routing uses a territory-first waterfall:

1. Match configured territory rules.
2. Assign directly if the territory maps to one rep.
3. Round-robin within the assigned team if multiple reps cover the territory.
4. Fall back to full-team round-robin if no territory matches.

Round-robin cursors are stored in SQLite, so distribution survives server restarts. Territory rule versions are also preserved on route decisions for historical accuracy.

## Audit Trail

Every processed lead gets a chronological audit timeline covering:

- Lead received and normalized
- Scoring started and completed
- AI explanation started and completed
- Routing started and completed
- Adapter calls started and completed
- Notification or nurture delivery outcomes

Audit events include lead ID, client ID, event type, timestamp, actor, provider key, provider mode, and structured details JSON. Timeline reads are ordered by timestamp and insertion order for stable dashboard rendering.

## Dashboard Workflow

In the dashboard:

1. Select a vertical from the client switcher.
2. Review seeded leads in the inbox.
3. Open a lead to inspect score breakdown, AI explanation, route decision, and audit history.
4. Toggle provider modes from the provider panel.
5. Click `Run Live Demo Lead` to send a fresh lead through the pipeline and refresh the selected detail view.

## Test Commands

```bash
npm test
npm run build
npm run db:seed
```

Useful focused tests:

```bash
npm test -- tests/scoring.test.js
npm test -- tests/routing.test.js
npm test -- tests/providers.test.js
npm test -- tests/pipeline.test.js
npm test -- tests/api.test.js
npm test -- tests/seed.test.js
```
