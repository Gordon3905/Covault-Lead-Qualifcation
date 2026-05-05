import Database from "better-sqlite3";
import { applySchema } from "../server/db/schema.js";

export function createTestDatabase() {
  const db = new Database(":memory:");
  applySchema(db);
  return db;
}
