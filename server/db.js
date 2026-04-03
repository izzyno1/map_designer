import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getDefaultDraft, normalizeDraftPayload } from "./services/draft-store.js";

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function parseJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function createStore({ dbPath }) {
  ensureDir(dbPath);

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS draft_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload_json TEXT NOT NULL
    );
  `);

  const draftCount = db.prepare("SELECT COUNT(*) AS count FROM draft_state").get().count;
  if (draftCount === 0) {
    db.prepare("INSERT INTO draft_state (id, payload_json) VALUES (1, ?)").run(
      JSON.stringify(getDefaultDraft()),
    );
  }

  const draftStateQuery = db.prepare(`
    SELECT payload_json
    FROM draft_state
    WHERE id = 1
  `);
  const upsertDraftStateQuery = db.prepare(`
    INSERT INTO draft_state (id, payload_json)
    VALUES (1, @payloadJson)
    ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json
  `);

  return {
    getDraft() {
      const row = draftStateQuery.get();
      if (!row) {
        const payload = getDefaultDraft();
        upsertDraftStateQuery.run({ payloadJson: JSON.stringify(payload) });
        return payload;
      }

      return normalizeDraftPayload(parseJson(row.payload_json, getDefaultDraft()));
    },
    saveDraft(payload) {
      const normalized = normalizeDraftPayload(payload);
      upsertDraftStateQuery.run({
        payloadJson: JSON.stringify(normalized),
      });
      return normalized;
    },
    buildDraftExport() {
      return this.getDraft();
    },
    close() {
      db.close();
    },
  };
}
