import { describe, expect, it } from "vitest";
import { createRepositories } from "../server/repositories/index.js";
import { createTestDatabase } from "./testDb.js";

describe("audit repository", () => {
  it("records lead audit events with provider context and structured details", () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const client = repos.clients.create({ name: "Demo Plumbing", slug: "plumbing" });
    const lead = repos.leads.createLead({ clientId: client.id, source: "mock", payload: { industry: "plumbing" } });

    repos.audit.record({
      clientId: client.id,
      leadId: lead.id,
      eventType: "provider.adapter_call_started",
      actor: "provider-registry",
      providerKey: "sales-notification",
      providerMode: "mock",
      details: { routeDecisionId: "route_123", repId: "rep_456" }
    });

    const events = repos.audit.listForLead(lead.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      leadId: lead.id,
      clientId: client.id,
      eventType: "provider.adapter_call_started",
      actor: "provider-registry",
      providerKey: "sales-notification",
      providerMode: "mock",
      details: { routeDecisionId: "route_123", repId: "rep_456" }
    });
    expect(events[0].createdAt).toEqual(expect.any(String));
  });

  it("records adapter delivery outcomes separately from audit timeline events", () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const client = repos.clients.create({ name: "Demo Law", slug: "law-firm" });
    const lead = repos.leads.createLead({ clientId: client.id, source: "mock", payload: { industry: "law_firm" } });

    const event = repos.audit.recordAdapterEvent({
      clientId: client.id,
      leadId: lead.id,
      providerKey: "nurture",
      mode: "mock",
      eventType: "nurture.enrollment",
      status: "delivered",
      details: { sequence: "Cold lead nurture" }
    });

    expect(event).toMatchObject({
      leadId: lead.id,
      clientId: client.id,
      providerKey: "nurture",
      mode: "mock",
      eventType: "nurture.enrollment",
      status: "delivered",
      details: { sequence: "Cold lead nurture" }
    });
  });

  it("orders lead audit events by timestamp and insertion order for stable timelines", () => {
    const db = createTestDatabase();
    const repos = createRepositories(db);
    const client = repos.clients.create({ name: "Demo Medical", slug: "medical-practice" });
    const lead = repos.leads.createLead({ clientId: client.id, source: "mock", payload: { industry: "medical_practice" } });

    db.prepare(`
      INSERT INTO audit_events (
        id, lead_id, client_id, event_type, actor, details_json, created_at
      )
      VALUES
        ('audit_b', @leadId, @clientId, 'second_same_time', 'test', '{}', '2026-05-05T20:00:00.000Z'),
        ('audit_a', @leadId, @clientId, 'first_same_time', 'test', '{}', '2026-05-05T20:00:00.000Z')
    `).run({ leadId: lead.id, clientId: client.id });

    expect(repos.audit.listForLead(lead.id).map((event) => event.id)).toEqual(["audit_b", "audit_a"]);
    expect(repos.leads.getLeadDetail(lead.id).auditEvents.map((event) => event.id)).toEqual(["audit_b", "audit_a"]);
  });
});
