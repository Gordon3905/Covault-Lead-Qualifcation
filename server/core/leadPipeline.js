import { generateLeadExplanation } from "./explanationService.js";
import { routeLead } from "./routingEngine.js";
import { scoreLead } from "./scoringEngine.js";
import { getProviderAdapter } from "../providers/registry.js";

export async function processLead({ clientSlug, source, payload, repos }) {
  const client = repos.clients.findBySlug(clientSlug);
  if (!client) {
    throw new Error(`Client not found: ${clientSlug}`);
  }

  const lead = repos.leads.createLead({ clientId: client.id, source, payload: normalizeLead(payload) });
  repos.audit.record({ clientId: client.id, leadId: lead.id, eventType: "lead.received", actor: "lead-pipeline", details: { source } });
  repos.audit.record({ clientId: client.id, leadId: lead.id, eventType: "lead.normalized", actor: "lead-pipeline", details: { source } });

  repos.audit.record({ clientId: client.id, leadId: lead.id, eventType: "scoring.started", actor: "scoring-engine" });
  const scoringVersion = repos.rules.getActiveScoringVersion(client.id);
  const scoringRules = repos.rules.listScoringRules(scoringVersion.id);
  const scoring = scoreLead(lead.payload, scoringRules, scoringVersion);
  const scoringRecord = repos.leads.saveScoringResult({ leadId: lead.id, ...scoring });
  repos.audit.record({
    clientId: client.id,
    leadId: lead.id,
    eventType: "scoring.completed",
    actor: "scoring-engine",
    details: { finalScore: scoring.finalScore, tier: scoring.tier, scoringRuleVersionId: scoring.scoringRuleVersionId }
  });

  const aiProvider = getProviderSetting(repos, client.id, "ai");
  repos.audit.record({
    clientId: client.id,
    leadId: lead.id,
    eventType: "ai.assessment.started",
    actor: "explanation-service",
    providerKey: "ai",
    providerMode: aiProvider.mode
  });
  const aiAdapter = aiProvider.enabled ? getProviderAdapter("ai", aiProvider.mode) : null;
  const explanation = await generateLeadExplanation({
    lead: lead.payload,
    scoreResult: scoring,
    aiEnabled: aiProvider.enabled,
    aiAdapter
  });
  repos.leads.saveAiAssessment({
    leadId: lead.id,
    scoringResultId: scoringRecord.id,
    providerKey: "ai",
    mode: aiProvider.mode,
    enabled: explanation.enabled,
    explanation: explanation.explanation,
    fallbackUsed: explanation.fallbackUsed
  });
  repos.audit.record({
    clientId: client.id,
    leadId: lead.id,
    eventType: "ai.assessment.completed",
    actor: "explanation-service",
    providerKey: "ai",
    providerMode: aiProvider.mode,
    details: { fallbackUsed: explanation.fallbackUsed }
  });

  if (scoring.tier === "nurture") {
    const delivery = await callNurtureAdapter({ repos, client, lead });
    return responseShape({ repos, lead, scoring, explanation, route: null, delivery });
  }

  repos.audit.record({ clientId: client.id, leadId: lead.id, eventType: "routing.started", actor: "routing-engine" });
  const territoryVersion = repos.rules.getActiveTerritoryVersion(client.id);
  const territories = repos.rules.listTerritoryRules(territoryVersion.id);
  const reps = repos.teams.listReps(client.id);
  const route = routeLead({
    lead: lead.payload,
    territoryVersion,
    territories,
    reps,
    cursorStore: {
      getAndAdvance: ({ scopeKey, repIds }) => repos.routing.getAndAdvanceCursor({ clientId: client.id, scopeKey, repIds })
    }
  });
  const routeRecord = repos.routing.saveRouteDecision({ leadId: lead.id, ...route });
  repos.audit.record({
    clientId: client.id,
    leadId: lead.id,
    eventType: "routing.completed",
    actor: "routing-engine",
    details: { repId: route.repId, strategy: route.strategy, territoryRuleVersionId: route.territoryRuleVersionId }
  });

  const rep = reps.find((candidate) => candidate.id === route.repId);
  const delivery = await callNotificationAdapter({ repos, client, lead, rep, routeRecord, explanation });
  return responseShape({ repos, lead, scoring, explanation, route: routeRecord, delivery });
}

function normalizeLead(payload) {
  return { ...payload };
}

function getProviderSetting(repos, clientId, providerKey) {
  return (
    repos.providers.listByClient(clientId).find((provider) => provider.providerKey === providerKey) ?? {
      providerKey,
      mode: "mock",
      enabled: true
    }
  );
}

async function callNotificationAdapter({ repos, client, lead, rep, routeRecord, explanation }) {
  const provider = getProviderSetting(repos, client.id, "sales-notification");
  return callAdapter({
    repos,
    client,
    lead,
    provider,
    eventType: "sales_notification.delivery",
    action: async () =>
      getProviderAdapter("sales-notification", provider.mode).notify({
        lead: lead.payload,
        rep,
        route: routeRecord,
        explanation: explanation.explanation
      })
  });
}

async function callNurtureAdapter({ repos, client, lead }) {
  const provider = getProviderSetting(repos, client.id, "nurture");
  return callAdapter({
    repos,
    client,
    lead,
    provider,
    eventType: "nurture.enrollment",
    action: async () =>
      getProviderAdapter("nurture", provider.mode).enrollInNurture({
        lead: lead.payload,
        sequence: { name: "Default nurture" }
      })
  });
}

async function callAdapter({ repos, client, lead, provider, eventType, action }) {
  repos.audit.record({
    clientId: client.id,
    leadId: lead.id,
    eventType: "provider.adapter_call_started",
    actor: "provider-registry",
    providerKey: provider.providerKey,
    providerMode: provider.mode
  });

  try {
    const result = await action();
    repos.audit.recordAdapterEvent({
      clientId: client.id,
      leadId: lead.id,
      providerKey: provider.providerKey,
      mode: provider.mode,
      eventType,
      status: result.status,
      details: result
    });
    repos.audit.record({
      clientId: client.id,
      leadId: lead.id,
      eventType: "provider.adapter_call_succeeded",
      actor: "provider-registry",
      providerKey: provider.providerKey,
      providerMode: provider.mode,
      details: { status: result.status }
    });
    return result;
  } catch (error) {
    const result = { providerKey: provider.providerKey, mode: provider.mode, status: "failed", message: error.message };
    repos.audit.recordAdapterEvent({
      clientId: client.id,
      leadId: lead.id,
      providerKey: provider.providerKey,
      mode: provider.mode,
      eventType,
      status: "failed",
      details: result
    });
    repos.audit.record({
      clientId: client.id,
      leadId: lead.id,
      eventType: "provider.adapter_call_failed",
      actor: "provider-registry",
      providerKey: provider.providerKey,
      providerMode: provider.mode,
      details: { message: error.message }
    });
    return result;
  }
}

function responseShape({ repos, lead, scoring, explanation, route, delivery }) {
  const detail = repos.leads.getLeadDetail(lead.id);
  return {
    lead,
    scoring,
    explanation,
    route,
    delivery,
    auditEventCount: detail.auditEvents.length
  };
}
