import { nanoid } from "nanoid";

export function createId(prefix) {
  return `${prefix}_${nanoid(12)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function stringifyJson(value) {
  return JSON.stringify(value ?? {});
}

export function parseJson(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  return JSON.parse(value);
}

export function boolToInt(value) {
  return value ? 1 : 0;
}
