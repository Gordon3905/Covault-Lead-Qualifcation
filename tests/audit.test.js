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
});
