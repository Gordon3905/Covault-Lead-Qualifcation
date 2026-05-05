import { boolToInt, createId, nowIso, parseJson, stringifyJson } from "./utils.js";

export function createProviderRepository(db) {
  return {
    upsert(input) {
      const existing = db.prepare(`
        SELECT * FROM provider_settings
        WHERE client_id = ? AND provider_key = ?
      `).get(input.clientId, input.providerKey);

      const now = nowIso();
      const setting = {
        id: existing?.id ?? input.id ?? createId("provider"),
        clientId: input.clientId,
        providerKey: input.providerKey,
        category: input.category,
        mode: input.mode ?? "mock",
        enabled: input.enabled ?? true,
        settings: input.settings ?? {},
        createdAt: existing?.created_at ?? now,
        updatedAt: now
      };

      db.prepare(`
        INSERT INTO provider_settings (
          id, client_id, provider_key, category, mode, enabled, settings_json, created_at, updated_at
        )
        VALUES (
          @id, @clientId, @providerKey, @category, @mode, @enabledInt, @settingsJson, @createdAt, @updatedAt
        )
        ON CONFLICT(client_id, provider_key) DO UPDATE SET
          category = excluded.category,
          mode = excluded.mode,
          enabled = excluded.enabled,
          settings_json = excluded.settings_json,
          updated_at = excluded.updated_at
      `).run({
        ...setting,
        enabledInt: boolToInt(setting.enabled),
        settingsJson: stringifyJson(setting.settings)
      });

      return setting;
    },

    listByClient(clientId) {
      return db.prepare(`
        SELECT * FROM provider_settings
        WHERE client_id = ?
        ORDER BY category, provider_key
      `).all(clientId).map(mapProviderSetting);
    },

    updateMode(clientId, providerKey, mode) {
      const updatedAt = nowIso();
      db.prepare(`
        UPDATE provider_settings
        SET mode = ?, updated_at = ?
        WHERE client_id = ? AND provider_key = ?
      `).run(mode, updatedAt, clientId, providerKey);

      const row = db.prepare(`
        SELECT * FROM provider_settings
        WHERE client_id = ? AND provider_key = ?
      `).get(clientId, providerKey);

      return row ? mapProviderSetting(row) : null;
    }
  };
}

function mapProviderSetting(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    providerKey: row.provider_key,
    category: row.category,
    mode: row.mode,
    enabled: Boolean(row.enabled),
    settings: parseJson(row.settings_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
