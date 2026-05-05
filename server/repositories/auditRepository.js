import { createId, nowIso, parseJson, stringifyJson } from "./utils.js";

export function createAuditRepository(db) {
  return {
    record(input) {
      const event = {
        id: input.id ?? createId("audit"),
        leadId: input.leadId ?? null,
        clientId: input.clientId,
        eventType: input.eventType,
        actor: input.actor ?? "system",
        providerKey: input.providerKey ?? null,
        providerMode: input.providerMode ?? null,
        details: input.details ?? {},
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO audit_events (
          id, lead_id, client_id, event_type, actor, provider_key, provider_mode, details_json, created_at
        )
        VALUES (
          @id, @leadId, @clientId, @eventType, @actor, @providerKey, @providerMode, @detailsJson, @createdAt
        )
      `).run({ ...event, detailsJson: stringifyJson(event.details) });

      return event;
    },

    listForLead(leadId) {
      return db.prepare(`
        SELECT * FROM audit_events
        WHERE lead_id = ?
        ORDER BY created_at ASC, id ASC
      `).all(leadId).map(mapAuditEvent);
    },

    recordAdapterEvent(input) {
      const event = {
        id: input.id ?? createId("adapter"),
        leadId: input.leadId ?? null,
        clientId: input.clientId,
        providerKey: input.providerKey,
        mode: input.mode,
        eventType: input.eventType,
        status: input.status,
        details: input.details ?? {},
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO adapter_events (
          id, lead_id, client_id, provider_key, mode, event_type, status, details_json, created_at
        )
        VALUES (
          @id, @leadId, @clientId, @providerKey, @mode, @eventType, @status, @detailsJson, @createdAt
        )
      `).run({ ...event, detailsJson: stringifyJson(event.details) });

      return event;
    }
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
