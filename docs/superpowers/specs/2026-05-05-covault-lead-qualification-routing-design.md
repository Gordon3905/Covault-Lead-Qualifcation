# CoVault Lead Qualification and Routing Design

## Summary

CoVault Lead Qualification and Routing is a modular full-stack JavaScript demo product that ingests leads from multiple sources, scores them with client-configurable weighted rules, optionally explains the score in natural language, routes qualified prospects to sales teams, and sends cold leads into nurture sequences.

The first version is a working local demo with real architecture boundaries: Node/Express API, React dashboard, SQLite persistence, and provider adapters that can run in `mock` or `live` mode independently. The core scoring and routing pipeline stays pure application logic so any single provider can move from mock to live without changing lead scoring, rule evaluation, routing, audit logging, or dashboard behavior.

## Goals

- Demo the complete workflow end to end immediately.
- Keep provider integrations replaceable through per-provider mock/live adapter modes.
- Persist client configuration, scoring rules, territory rules, round-robin state, and audit history.
- Keep historical lead scores and route decisions stable when rules change.
- Support multiple demo verticals without reconfiguration between sales calls.
- Provide clear manager-facing explanations for why a lead scored and routed the way it did.

## Non-Goals For The First Version

- Full production multi-tenant authentication.
- Real CRM, sales notification, nurture, or AI provider credentials by default.
- Background queue infrastructure beyond repository-backed event records.
- Billing, user permissions, or enterprise account administration.

## Architecture

The app has four main layers:

1. React dashboard for operations, rule configuration, provider mode toggles, and demos.
2. Node/Express API for intake, dashboard data, configuration, and demo simulation.
3. Pure core pipeline modules for normalization, scoring, AI explanation orchestration, routing, and audit event generation.
4. Provider adapters for source ingestion, CRM sync, sales notifications, nurture enrollment, and AI assessment.

SQLite is used for local persistence. Database access is isolated behind repository modules so the schema can later move to Postgres with minimal changes to service and pipeline code.

## Lead Pipeline

1. A lead enters through a mock source, webhook/API endpoint, or future live provider.
2. The intake layer normalizes provider-specific payloads into a canonical lead record.
3. The scoring service loads the active scoring rule version for the client and calculates the score.
4. The scoring result stores the exact scoring rule version used, matched rules, missed criteria, final score, and qualification tier.
5. If AI assessment is enabled, the AI assessment adapter receives the lead and score breakdown and returns a short natural-language explanation.
6. If AI assessment is disabled or unavailable, the app generates a deterministic template explanation from the score breakdown.
7. The routing service loads the active territory rule version and resolves territory matches.
8. Routing assigns by territory first, round-robin within matched team second, and full-team round-robin as a final fallback.
9. Qualified and review leads trigger sales notification adapter calls.
10. Cold leads trigger nurture adapter calls.
11. Every score calculation, route decision, adapter call, and delivery result is written to the lead audit log with timestamps.

## Scoring

The rules engine is deterministic and drives all qualification and routing outcomes. AI-generated text never changes the score.

Client-configurable scoring criteria include:

- Industry.
- Company size.
- Budget.
- Urgency.
- Location.
- Source quality.
- Custom fields.

Each scoring rule has:

- Rule version ID.
- Field or custom field name.
- Operator.
- Match value.
- Weight.
- Score contribution.
- Optional negative contribution.
- Human-readable label.

The scoring engine returns:

- Final score.
- Qualification tier: `qualified`, `review`, or `nurture`.
- Matched rules.
- Missed criteria.
- Score breakdown suitable for dashboard display.
- Scoring rule version ID.

## Rule Versioning

Scoring rules and territory rules are versioned separately.

When a client edits scoring rules, the system creates a new scoring rule version and marks it active for future leads. Existing leads keep their original scoring result, score breakdown, qualification tier, and scoring rule version reference.

When a client edits territory rules, the system creates a new territory rule version and marks it active for future route decisions. Existing route decisions keep their original territory match details, assigned rep/team, and territory rule version reference.

Versioning supports rollback by reactivating a prior rule version for new leads. It does not mutate historical lead outcomes.

## AI Assessment

The AI layer is a translator, not the engine. It receives the canonical lead and deterministic score breakdown and returns a short explanation of why the lead is qualified, borderline, or cold.

AI assessment can be toggled off per client or provider setting. When disabled, the app uses a deterministic explanation template based on matched and missed scoring rules.

The first version includes:

- Mock AI adapter for demos.
- Live AI adapter boundary for future provider credentials.
- Stored AI assessment record linked to the lead and scoring result.
- Audit events for AI request, success, fallback, or failure.

## Routing

Territory rules are primary. Round-robin is the fallback and load-balancing mechanism.

Territory definitions can match on:

- Region.
- Industry vertical.
- Account size.
- Source.
- Budget.
- Urgency.
- Custom fields.

Routing behavior:

- If one territory matches one rep, assign directly.
- If one territory maps to a team, assign by persisted round-robin cursor within that team.
- If multiple territories match, choose the highest priority territory, with specificity as the tie-breaker.
- If no territory matches, assign through persisted full-team round-robin.
- Every qualified or review lead receives a route decision; no eligible lead remains unrouted.

Round-robin cursors are stored in the database by client and scope so distribution stays even over time.

## Audit Log

Every lead has a timestamped audit trail that can be shown in the dashboard.

Audit events include:

- Lead received.
- Lead normalized.
- Scoring started.
- Scoring completed.
- AI assessment requested.
- AI assessment completed or skipped.
- Routing started.
- Territory matched or missed.
- Round-robin cursor read and advanced.
- Route decision completed.
- Provider adapter call started.
- Provider adapter call succeeded, failed, or fell back to mock behavior.
- Sales notification delivery simulated or sent.
- Nurture enrollment simulated or sent.

Each audit event stores:

- Lead ID.
- Client ID.
- Event type.
- Timestamp.
- Actor or system component.
- Provider name when relevant.
- Provider mode when relevant.
- Structured details JSON.

This audit trail answers why a lead scored, why it routed to a rep, which adapters ran, and whether notification or nurture delivery completed.

## Provider Adapters

Adapters share a small interface and are selected through persisted provider settings.

Initial provider categories:

- Lead source adapter.
- Webhook/API intake adapter.
- CRM sync adapter boundary.
- Sales notification adapter.
- Nurture adapter.
- AI assessment adapter.

Each provider can run in `mock` or `live` mode independently. The provider registry resolves the correct adapter implementation at runtime. Live adapters can be added later without touching core scoring or routing logic.

## Persistence Model

SQLite tables include:

- Clients.
- Provider settings.
- Leads.
- Lead custom fields.
- Scoring rule versions.
- Scoring rules.
- Scoring results.
- AI assessments.
- Territory rule versions.
- Territory rules.
- Teams.
- Reps.
- Round-robin cursors.
- Route decisions.
- Adapter events.
- Audit events.
- Nurture sequences.

Repository modules hide SQL details from services and pipeline modules.

## API Surface

Initial API endpoints:

- `POST /api/leads` ingests a lead.
- `GET /api/leads` lists leads for the dashboard.
- `GET /api/leads/:id` returns lead detail, score, route, audit, and adapter activity.
- `GET /api/config/scoring` returns active and historical scoring rule versions.
- `POST /api/config/scoring/versions` creates a new scoring rule version.
- `GET /api/config/territories` returns active and historical territory rule versions.
- `POST /api/config/territories/versions` creates a new territory rule version.
- `GET /api/config/providers` returns provider mode settings.
- `PATCH /api/config/providers/:providerKey` toggles mock/live mode and settings.
- `GET /api/reps` returns teams and reps.
- `POST /api/demo/seed` reseeds demo data.
- `POST /api/demo/leads` creates a simulated demo lead.

## Dashboard

The first screen is the operational console.

Dashboard views include:

- Lead inbox with score, tier, source, industry, route status, and latest activity.
- Lead detail drawer with score breakdown, AI explanation, route decision, and audit timeline.
- Scoring rule version editor.
- Territory rule version editor.
- Team and rep management.
- Provider mode toggles.
- Demo lead simulator.
- Nurture sequence overview.

The UI should be quiet, dense, and work-focused. It should favor tables, filters, compact controls, status badges, and clear activity timelines over marketing-style presentation.

## Demo Seed Data

The seed data includes multiple verticals so the demo can flex across sales calls without reconfiguration:

- Real estate.
- Plumbing.
- Law firm.
- Medical practice.

Each vertical includes:

- Client profile.
- Scoring rules.
- Territory rules.
- Reps and teams.
- Provider settings.
- Nurture sequence examples.
- Sample leads across qualified, review, and nurture tiers.

## Error Handling

Provider failures are recorded as adapter and audit events. Core score and route decisions remain available even when a downstream notification, nurture, or AI provider fails.

If AI assessment fails, the system falls back to deterministic explanation text.

If sales notification fails, the route decision remains persisted and the dashboard shows delivery status.

If territory rules are invalid, the system falls back to full-team round-robin and writes an audit event.

## Testing

Automated tests cover:

- Scoring rule evaluation.
- Scoring rule version immutability for historical leads.
- AI assessment toggle and deterministic fallback.
- Territory matching.
- Territory rule version immutability for historical route decisions.
- Round-robin cursor persistence.
- Full-team fallback when no territory matches.
- Guarantee that qualified and review leads are never unrouted.
- Provider adapter mode selection.
- Audit log creation for scoring, routing, adapter calls, and deliveries.
- API response contracts.

## Acceptance Criteria

- A user can run the app locally, seed data, and demo the full workflow.
- A lead can be ingested and normalized through the API or demo simulator.
- Scoring uses active weighted rules and stores the scoring version used.
- AI explanations are visible when enabled and deterministic explanations appear when disabled.
- Routing uses territory first, then team round-robin, then full-team round-robin.
- Round-robin state persists across lead assignments.
- Provider mode can be toggled per provider without changing core logic.
- Every lead has a clear audit trail covering scoring, routing, adapter calls, and delivery outcomes.
- Rule edits affect new leads only and preserve historical scores and routes.
- Demo data covers real estate, plumbing, law firm, and medical practice verticals.
