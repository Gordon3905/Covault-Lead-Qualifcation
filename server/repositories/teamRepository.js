import { createId, nowIso } from "./utils.js";

export function createTeamRepository(db) {
  return {
    createTeam(input) {
      const team = {
        id: input.id ?? createId("team"),
        clientId: input.clientId,
        name: input.name,
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO teams (id, client_id, name, created_at)
        VALUES (@id, @clientId, @name, @createdAt)
      `).run(team);

      return team;
    },

    createRep(input) {
      const rep = {
        id: input.id ?? createId("rep"),
        clientId: input.clientId,
        teamId: input.teamId ?? null,
        name: input.name,
        email: input.email,
        active: input.active ?? true,
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO reps (id, client_id, team_id, name, email, active, created_at)
        VALUES (@id, @clientId, @teamId, @name, @email, @activeInt, @createdAt)
      `).run({ ...rep, activeInt: rep.active ? 1 : 0 });

      return rep;
    },

    listTeams(clientId) {
      return db.prepare(`
        SELECT * FROM teams
        WHERE client_id = ?
        ORDER BY name
      `).all(clientId).map(mapTeam);
    },

    listReps(clientId) {
      return db.prepare(`
        SELECT * FROM reps
        WHERE client_id = ?
        ORDER BY name
      `).all(clientId).map(mapRep);
    }
  };
}

function mapTeam(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    createdAt: row.created_at
  };
}

function mapRep(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    teamId: row.team_id,
    name: row.name,
    email: row.email,
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}
