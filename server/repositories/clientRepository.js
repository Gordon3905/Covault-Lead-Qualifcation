import { createId, nowIso } from "./utils.js";

export function createClientRepository(db) {
  return {
    create(input) {
      const client = {
        id: input.id ?? createId("client"),
        name: input.name,
        slug: input.slug,
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO clients (id, name, slug, created_at)
        VALUES (@id, @name, @slug, @createdAt)
      `).run(client);

      return client;
    },

    findBySlug(slug) {
      const row = db.prepare("SELECT * FROM clients WHERE slug = ?").get(slug);
      return row ? mapClient(row) : null;
    },

    findById(id) {
      const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
      return row ? mapClient(row) : null;
    }
  };
}

function mapClient(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at
  };
}
