import { Router } from "express";
import { processLead } from "../core/leadPipeline.js";

export function createDemoRouter(repos) {
  const router = Router();

  router.post("/leads", async (request, response, next) => {
    try {
      const result = await processLead({
        clientSlug: request.body.clientSlug,
        source: "demo-simulator",
        payload: request.body.payload ?? {},
        repos
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/seed", (_request, response) => {
    response.status(501).json({ error: "Demo seed runner is implemented in Task 7" });
  });

  return router;
}
