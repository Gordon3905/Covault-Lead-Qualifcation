import { boolToInt, createId, nowIso, parseJson, stringifyJson } from "./utils.js";

export function createRuleRepository(db) {
  return {
    createScoringVersion(input) {
      const version = {
        id: input.id ?? createId("scorever"),
        clientId: input.clientId,
        name: input.name,
        active: Boolean(input.active),
        createdAt: nowIso()
      };

      if (version.active) {
        db.prepare("UPDATE scoring_rule_versions SET active = 0 WHERE client_id = ?").run(version.clientId);
      }

      db.prepare(`
        INSERT INTO scoring_rule_versions (id, client_id, name, active, created_at)
        VALUES (@id, @clientId, @name, @activeInt, @createdAt)
      `).run({ ...version, activeInt: boolToInt(version.active) });

      return version;
    },

    getActiveScoringVersion(clientId) {
      const row = db.prepare(`
        SELECT * FROM scoring_rule_versions
        WHERE client_id = ? AND active = 1
        ORDER BY created_at DESC
        LIMIT 1
      `).get(clientId);
      return row ? mapScoringVersion(row) : null;
    },

    addScoringRule(input) {
      const rule = {
        id: input.id ?? createId("scorerule"),
        scoringRuleVersionId: input.scoringRuleVersionId,
        field: input.field,
        operator: input.operator,
        value: input.value,
        points: Number(input.points),
        weight: Number(input.weight ?? 1),
        label: input.label,
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO scoring_rules (
          id, scoring_rule_version_id, field, operator, value_json, points, weight, label, created_at
        )
        VALUES (@id, @scoringRuleVersionId, @field, @operator, @valueJson, @points, @weight, @label, @createdAt)
      `).run({ ...rule, valueJson: stringifyJson(rule.value) });

      return rule;
    },

    listScoringRules(versionId) {
      return db.prepare(`
        SELECT * FROM scoring_rules
        WHERE scoring_rule_version_id = ?
        ORDER BY created_at, id
      `).all(versionId).map(mapScoringRule);
    },

    createTerritoryVersion(input) {
      const version = {
        id: input.id ?? createId("terrver"),
        clientId: input.clientId,
        name: input.name,
        active: Boolean(input.active),
        createdAt: nowIso()
      };

      if (version.active) {
        db.prepare("UPDATE territory_rule_versions SET active = 0 WHERE client_id = ?").run(version.clientId);
      }

      db.prepare(`
        INSERT INTO territory_rule_versions (id, client_id, name, active, created_at)
        VALUES (@id, @clientId, @name, @activeInt, @createdAt)
      `).run({ ...version, activeInt: boolToInt(version.active) });

      return version;
    },

    getActiveTerritoryVersion(clientId) {
      const row = db.prepare(`
        SELECT * FROM territory_rule_versions
        WHERE client_id = ? AND active = 1
        ORDER BY created_at DESC
        LIMIT 1
      `).get(clientId);
      return row ? mapTerritoryVersion(row) : null;
    },

    addTerritoryRule(input) {
      const rule = {
        id: input.id ?? createId("terrrule"),
        territoryRuleVersionId: input.territoryRuleVersionId,
        name: input.name,
        priority: Number(input.priority ?? 0),
        teamId: input.teamId ?? null,
        repId: input.repId ?? null,
        conditions: input.conditions ?? [],
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO territory_rules (
          id, territory_rule_version_id, name, priority, team_id, rep_id, conditions_json, created_at
        )
        VALUES (@id, @territoryRuleVersionId, @name, @priority, @teamId, @repId, @conditionsJson, @createdAt)
      `).run({ ...rule, conditionsJson: stringifyJson(rule.conditions) });

      return rule;
    },

    listTerritoryRules(versionId) {
      return db.prepare(`
        SELECT * FROM territory_rules
        WHERE territory_rule_version_id = ?
        ORDER BY priority DESC, created_at, id
      `).all(versionId).map(mapTerritoryRule);
    }
  };
}

function mapScoringVersion(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

function mapScoringRule(row) {
  return {
    id: row.id,
    scoringRuleVersionId: row.scoring_rule_version_id,
    field: row.field,
    operator: row.operator,
    value: parseJson(row.value_json),
    points: row.points,
    weight: row.weight,
    label: row.label,
    createdAt: row.created_at
  };
}

function mapTerritoryVersion(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

function mapTerritoryRule(row) {
  return {
    id: row.id,
    territoryRuleVersionId: row.territory_rule_version_id,
    name: row.name,
    priority: row.priority,
    teamId: row.team_id,
    repId: row.rep_id,
    conditions: parseJson(row.conditions_json, []),
    createdAt: row.created_at
  };
}
