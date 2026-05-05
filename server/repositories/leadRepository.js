import { createId, nowIso, parseJson, stringifyJson } from "./utils.js";

export function createLeadRepository(db) {
  return {
    createLead(input) {
      const lead = {
        id: input.id ?? createId("lead"),
        clientId: input.clientId,
        source: input.source,
        status: input.status ?? "new",
        payload: input.payload ?? {},
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      db.prepare(`
        INSERT INTO leads (id, client_id, source, status, payload_json, created_at, updated_at)
        VALUES (@id, @clientId, @source, @status, @payloadJson, @createdAt, @updatedAt)
      `).run({ ...lead, payloadJson: stringifyJson(lead.payload) });

      return lead;
    },

    listLeads(clientId) {
      return db.prepare(`
        SELECT * FROM leads
        WHERE client_id = ?
        ORDER BY created_at DESC
      `).all(clientId).map(mapLead);
    },

    saveScoringResult(input) {
      const result = {
        id: input.id ?? createId("scoreresult"),
        leadId: input.leadId,
        scoringRuleVersionId: input.scoringRuleVersionId,
        finalScore: Number(input.finalScore),
        tier: input.tier,
        breakdown: input.breakdown ?? [],
        matchedRules: input.matchedRules ?? [],
        missedCriteria: input.missedCriteria ?? [],
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO scoring_results (
          id, lead_id, scoring_rule_version_id, final_score, tier,
          breakdown_json, matched_rules_json, missed_criteria_json, created_at
        )
        VALUES (
          @id, @leadId, @scoringRuleVersionId, @finalScore, @tier,
          @breakdownJson, @matchedRulesJson, @missedCriteriaJson, @createdAt
        )
      `).run({
        ...result,
        breakdownJson: stringifyJson(result.breakdown),
        matchedRulesJson: stringifyJson(result.matchedRules),
        missedCriteriaJson: stringifyJson(result.missedCriteria)
      });

      return result;
    },

    saveAiAssessment(input) {
      const assessment = {
        id: input.id ?? createId("ai"),
        leadId: input.leadId,
        scoringResultId: input.scoringResultId ?? null,
        providerKey: input.providerKey,
        mode: input.mode,
        enabled: Boolean(input.enabled),
        explanation: input.explanation,
        fallbackUsed: Boolean(input.fallbackUsed),
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO ai_assessments (
          id, lead_id, scoring_result_id, provider_key, mode, enabled,
          explanation, fallback_used, created_at
        )
        VALUES (
          @id, @leadId, @scoringResultId, @providerKey, @mode, @enabledInt,
          @explanation, @fallbackUsedInt, @createdAt
        )
      `).run({
        ...assessment,
        enabledInt: assessment.enabled ? 1 : 0,
        fallbackUsedInt: assessment.fallbackUsed ? 1 : 0
      });

      return assessment;
    },

    getLeadDetail(leadId) {
      const leadRow = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
      if (!leadRow) {
        return null;
      }

      const scoringRow = db.prepare("SELECT * FROM scoring_results WHERE lead_id = ?").get(leadId);
      const routeRow = db.prepare("SELECT * FROM route_decisions WHERE lead_id = ?").get(leadId);
      const assessmentRows = db.prepare(`
        SELECT * FROM ai_assessments
        WHERE lead_id = ?
        ORDER BY created_at DESC
      `).all(leadId);
      const auditRows = db.prepare(`
        SELECT * FROM audit_events
        WHERE lead_id = ?
        ORDER BY created_at ASC, id ASC
      `).all(leadId);

      return {
        ...mapLead(leadRow),
        scoring: scoringRow ? mapScoringResult(scoringRow) : null,
        route: routeRow ? mapRouteDecision(routeRow) : null,
        aiAssessments: assessmentRows.map(mapAiAssessment),
        auditEvents: auditRows.map(mapAuditEvent)
      };
    }
  };
}

function mapLead(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    source: row.source,
    status: row.status,
    payload: parseJson(row.payload_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapScoringResult(row) {
  return {
    id: row.id,
    leadId: row.lead_id,
    scoringRuleVersionId: row.scoring_rule_version_id,
    finalScore: row.final_score,
    tier: row.tier,
    breakdown: parseJson(row.breakdown_json, []),
    matchedRules: parseJson(row.matched_rules_json, []),
    missedCriteria: parseJson(row.missed_criteria_json, []),
    createdAt: row.created_at
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

function mapAiAssessment(row) {
  return {
    id: row.id,
    leadId: row.lead_id,
    scoringResultId: row.scoring_result_id,
    providerKey: row.provider_key,
    mode: row.mode,
    enabled: Boolean(row.enabled),
    explanation: row.explanation,
    fallbackUsed: Boolean(row.fallback_used),
    createdAt: row.created_at
  };
}

function mapAuditEvent(row) {
  return {
    id: row.id,
    leadId: row.lead_id,
    clientId: row.client_id,
    eventType: row.event_type,
    actor: row.actor,
    providerKey: row.provider_key,
    providerMode: row.provider_mode,
    details: parseJson(row.details_json),
    createdAt: row.created_at
  };
}
