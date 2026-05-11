import DatabaseDriver from "better-sqlite3";

export interface Database {
  readonly path: string;
  readonly client: DatabaseDriver.Database;
  init(): Promise<void>;
  close(): Promise<void>;
}

export async function createDatabase(path = process.env.WORKFLOW_DB_PATH ?? "workflow.db"): Promise<Database> {
  const client = new DatabaseDriver(path);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");

  return {
    path,
    client,
    async init() {
      client.exec(`
        CREATE TABLE IF NOT EXISTS workflow_sessions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          problem_statement TEXT NOT NULL,
          constraints_json TEXT NOT NULL,
          desired_outcomes_json TEXT NOT NULL,
          state TEXT NOT NULL,
          current_spec_version INTEGER,
          current_plan_version INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS artifacts (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          type TEXT NOT NULL,
          version INTEGER NOT NULL,
          format TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(session_id, type, version),
          FOREIGN KEY(session_id) REFERENCES workflow_sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          artifact_type TEXT NOT NULL,
          artifact_version INTEGER,
          kind TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(session_id) REFERENCES workflow_sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS approvals (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          artifact_type TEXT NOT NULL,
          artifact_version INTEGER NOT NULL,
          note TEXT NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(session_id, artifact_type, artifact_version),
          FOREIGN KEY(session_id) REFERENCES workflow_sessions(id) ON DELETE CASCADE
        );
      `);
    },
    async close() {
      client.close();
    }
  };
}
