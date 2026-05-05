import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applySchema } from "./schema.js";

export function createDatabase(path = process.env.DATABASE_PATH || "data/covault.sqlite") {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  applySchema(db);
  return db;
}
