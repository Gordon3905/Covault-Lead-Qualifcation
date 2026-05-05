export function applySchema(db) {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS provider_settings (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      provider_key TEXT NOT NULL,
      category TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('mock', 'live')),
      enabled INTEGER NOT NULL DEFAULT 1,
      settings_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (client_id, provider_key),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lead_custom_fields (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      field_key TEXT NOT NULL,
      field_value TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (lead_id, field_key),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scoring_rule_versions (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scoring_rules (
      id TEXT PRIMARY KEY,
      scoring_rule_version_id TEXT NOT NULL,
      field TEXT NOT NULL,
      operator TEXT NOT NULL,
      value_json TEXT NOT NULL,
      points INTEGER NOT NULL,
      weight REAL NOT NULL DEFAULT 1,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (scoring_rule_version_id) REFERENCES scoring_rule_versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scoring_results (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL UNIQUE,
      scoring_rule_version_id TEXT NOT NULL,
      final_score INTEGER NOT NULL,
      tier TEXT NOT NULL,
      breakdown_json TEXT NOT NULL,
      matched_rules_json TEXT NOT NULL DEFAULT '[]',
      missed_criteria_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (scoring_rule_version_id) REFERENCES scoring_rule_versions(id)
    );

    CREATE TABLE IF NOT EXISTS ai_assessments (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      scoring_result_id TEXT,
      provider_key TEXT NOT NULL,
      mode TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      fallback_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (scoring_result_id) REFERENCES scoring_results(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS territory_rule_versions (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS territory_rules (
      id TEXT PRIMARY KEY,
      territory_rule_version_id TEXT NOT NULL,
      name TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      team_id TEXT,
      rep_id TEXT,
      conditions_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (territory_rule_version_id) REFERENCES territory_rule_versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reps (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      team_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS round_robin_cursors (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      next_index INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE (client_id, scope_key),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS route_decisions (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL UNIQUE,
      territory_rule_version_id TEXT,
      territory_id TEXT,
      team_id TEXT,
      rep_id TEXT NOT NULL,
      strategy TEXT NOT NULL,
      reason TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (territory_rule_version_id) REFERENCES territory_rule_versions(id),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (rep_id) REFERENCES reps(id)
    );

    CREATE TABLE IF NOT EXISTS adapter_events (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      client_id TEXT NOT NULL,
      provider_key TEXT NOT NULL,
      mode TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      client_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      provider_key TEXT,
      provider_mode TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nurture_sequences (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trigger_tier TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);
}
