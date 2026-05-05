import { Router } from "express";

export function createConfigRouter(repos) {
  const router = Router();

  router.get("/providers", (request, response) => {
    const client = repos.clients.findBySlug(request.query.clientSlug);
    response.json({ providers: client ? repos.providers.listByClient(client.id) : [] });
  });

  router.patch("/providers/:providerKey", (request, response) => {
    const client = repos.clients.findBySlug(request.body.clientSlug);
    if (!client) {
      response.status(404).json({ error: "Client not found" });
      return;
    }

    const provider = repos.providers.updateMode(client.id, request.params.providerKey, request.body.mode);
    response.json({ provider });
  });

  router.get("/scoring", (request, response) => {
    const client = repos.clients.findBySlug(request.query.clientSlug);
    response.json({ activeVersion: client ? repos.rules.getActiveScoringVersion(client.id) : null });
  });

  router.post("/scoring/versions", (request, response) => {
    const client = repos.clients.findBySlug(request.body.clientSlug);
    if (!client) {
      response.status(404).json({ error: "Client not found" });
      return;
    }

    const version = repos.rules.createScoringVersion({ clientId: client.id, name: request.body.name, active: true });
    for (const rule of request.body.rules ?? []) {
      repos.rules.addScoringRule({ scoringRuleVersionId: version.id, ...rule });
    }
    response.status(201).json({ version, rules: repos.rules.listScoringRules(version.id) });
  });

  router.get("/territories", (request, response) => {
    const client = repos.clients.findBySlug(request.query.clientSlug);
    response.json({ activeVersion: client ? repos.rules.getActiveTerritoryVersion(client.id) : null });
  });

  router.post("/territories/versions", (request, response) => {
    const client = repos.clients.findBySlug(request.body.clientSlug);
    if (!client) {
      response.status(404).json({ error: "Client not found" });
      return;
    }

    const version = repos.rules.createTerritoryVersion({ clientId: client.id, name: request.body.name, active: true });
    for (const rule of request.body.rules ?? []) {
      repos.rules.addTerritoryRule({ territoryRuleVersionId: version.id, ...rule });
    }
    response.status(201).json({ version, rules: repos.rules.listTerritoryRules(version.id) });
  });

  return router;
}
