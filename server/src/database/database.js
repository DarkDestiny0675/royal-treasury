import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { environment } from "../config/environment.js";
import { DATABASE_SCHEMA_VERSION, schemaStatements } from "./schema.js";

let database;

function migrate(db) {
  const roomColumns = db.prepare("PRAGMA table_info(rooms)").all();
  if (roomColumns.length && !roomColumns.some((column) => column.name === "room_code")) {
    db.exec("ALTER TABLE rooms ADD COLUMN room_code TEXT");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code)");
  }
  if (roomColumns.length && !roomColumns.some((column) => column.name === "victory_target")) {
    db.exec("ALTER TABLE rooms ADD COLUMN victory_target INTEGER NOT NULL DEFAULT 20");
  }
  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  if (userColumns.length && !userColumns.some((column) => column.name === "is_admin")) db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  const existingAdmin = db.prepare("SELECT user_id FROM users WHERE is_admin = 1 LIMIT 1").get();
  if (!existingAdmin) {
    const firstUser = db.prepare("SELECT user_id FROM users ORDER BY created_at, user_id LIMIT 1").get();
    if (firstUser) db.prepare("UPDATE users SET is_admin = 1 WHERE user_id = ?").run(firstUser.user_id);
  }
  const postColumns = db.prepare("PRAGMA table_info(community_posts)").all();
  if (postColumns.length && !postColumns.some((column) => column.name === "is_pinned")) db.exec("ALTER TABLE community_posts ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0");
  if (postColumns.length && !postColumns.some((column) => column.name === "is_locked")) db.exec("ALTER TABLE community_posts ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0");
  const memberColumns = db.prepare("PRAGMA table_info(room_members)").all();
  if (memberColumns.length && !memberColumns.some((column) => column.name === "is_ready")) {
    db.exec("ALTER TABLE room_members ADD COLUMN is_ready INTEGER NOT NULL DEFAULT 0");
    db.exec("UPDATE room_members SET is_ready = 1 WHERE member_type = 'ai'");
  }
}

function applySchema(db) {
  db.transaction(() => {
    for (const statement of schemaStatements) db.exec(statement);
    migrate(db);
    db.prepare("INSERT OR IGNORE INTO schema_versions (version) VALUES (?)").run(DATABASE_SCHEMA_VERSION);
  })();
}

export function initializeDatabase() {
  if (database) return database;
  fs.mkdirSync(path.dirname(environment.databasePath), { recursive: true });
  database = new Database(environment.databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  applySchema(database);
  database.pragma("wal_checkpoint(TRUNCATE)");
  database.prepare("PRAGMA integrity_check").pluck().get();
  return database;
}
export function getDatabase() { return database || initializeDatabase(); }
export function closeDatabase() { if (database) { database.close(); database = undefined; } }
