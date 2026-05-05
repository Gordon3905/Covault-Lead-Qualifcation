import { createId, nowIso, parseJson, stringifyJson } from "./utils.js";

export function createRoutingRepository(db) {
  return {
    saveRouteDecision(input) {
      const decision = {
        id: input.id ?? createId("route"),
        leadId: input.leadId,
        territoryRuleVersionId: input.territoryRuleVersionId ?? null,
        territoryId: input.territoryId ?? null,
        teamId: input.teamId ?? null,
        repId: input.repId,
        strategy: input.strategy,
        reason: input.reason,
        details: input.details ?? {},
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO route_decisions (
          id, lead_id, territory_rule_version_id, territory_id, team_id,
          rep_id, strategy, reason, details_json, created_at
        )
        VALUES (
          @id, @leadId, @territoryRuleVersionId, @territoryId, @teamId,
          @repId, @strategy, @reason, @detailsJson, @createdAt
        )
      `).run({ ...decision, detailsJson: stringifyJson(decision.details) });

      return decision;
    },

    getAndAdvanceCursor({ clientId, scopeKey, repIds }) {
      if (!repIds.length) {
        throw new Error(`Cannot advance round-robin cursor ${scopeKey} without reps`);
      }

      const existing = db.prepare(`
        SELECT * FROM round_robin_cursors
        WHERE client_id = ? AND scope_key = ?
      `).get(clientId, scopeKey);

      const currentIndex = existing?.next_index ?? 0;
      const selectedRepId = repIds[currentIndex % repIds.length];
      const nextIndex = (currentIndex + 1) % repIds.length;
      const updatedAt = nowIso();

      db.prepare(`
        INSERT INTO round_robin_cursors (id, client_id, scope_key, next_index, updated_at)
        VALUES (@id, @clientId, @scopeKey, @nextIndex, @updatedAt)
        ON CONFLICT(client_id, scope_key) DO UPDATE SET
          next_index = excluded.next_index,
          updated_at = excluded.updated_at
      `).run({
        id: existing?.id ?? createId("cursor"),
        clientId,
        scopeKey,
        nextIndex,
        updatedAt
      });

      return {
        scopeKey,
        selectedRepId,
        previousIndex: currentIndex,
        nextIndex
      };
    },

    getRouteDecision(leadId) {
      const row = db.prepare("SELECT * FROM route_decisions WHERE lead_id = ?").get(leadId);
      return row ? mapRouteDecision(row) : null;
    }
  };
}

function mapRouteDecision(row) {
  return {
    id: row.id,
    leadId: row.lead_id,
    territoryRuleVersionId: row.territory_rule_version_id,
    territoryId: row.territory_id,
    teamId: row.team_id,
    repId: row.rep_id,
    strategy: row.strategy,
    reason: row.reason,
    details: parseJson(row.details_json),
    createdAt: row.created_at
  };
}
