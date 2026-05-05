import { Router } from "express";
import { processLead } from "../core/leadPipeline.js";

export function createLeadRouter(repos) {
  const router = Router();

  router.post("/", async (request, response, next) => {
    try {
      const result = await processLead({
        clientSlug: request.body.clientSlug,
        source: request.body.source ?? "api",
        payload: request.body.payload ?? {},
        repos
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", (request, response) => {
    const client = repos.clients.findBySlug(request.query.clientSlug);
    if (!client) {
      response.status(404).json({ error: "Client not found" });
      return;
    }

    response.json({ leads: repos.leads.listLeads(client.id) });
  });

  router.get("/:id", (request, response) => {
    const lead = repos.leads.getLeadDetail(request.params.id);
    if (!lead) {
      response.status(404).json({ error: "Lead not found" });
      return;
    }

    response.json({ lead });
  });

  return router;
}
