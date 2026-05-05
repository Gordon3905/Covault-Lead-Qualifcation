import { Router } from "express";

export function createRepsRouter(repos) {
  const router = Router();

  router.get("/", (request, response) => {
    const client = repos.clients.findBySlug(request.query.clientSlug);
    response.json({
      teams: client ? repos.teams.listTeams(client.id) : [],
      reps: client ? repos.teams.listReps(client.id) : []
    });
  });

  return router;
}
