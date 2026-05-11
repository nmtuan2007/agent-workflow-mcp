import { Database } from "../sqlite.js";
import { ApprovalRecord, WorkflowSession } from "../../domain/types.js";

type SessionRow = {
  id: string;
  title: string;
  problem_statement: string;
  constraints_json: string;
  desired_outcomes_json: string;
  state: WorkflowSession["state"];
  current_spec_version: number | null;
  current_plan_version: number | null;
  created_at: string;
  updated_at: string;
};

type ApprovalRow = {
  id: string;
  session_id: string;
  artifact_type: "spec" | "plan";
  artifact_version: number;
  note: string;
  created_at: string;
};

export class WorkflowRepository {
  constructor(private readonly db: Database) {}

  async save(session: WorkflowSession): Promise<void> {
    this.db.client
      .prepare(`
        INSERT INTO workflow_sessions (
          id, title, problem_statement, constraints_json, desired_outcomes_json,
          state, current_spec_version, current_plan_version, created_at, updated_at
        ) VALUES (
          @id, @title, @problemStatement, @constraintsJson, @desiredOutcomesJson,
          @state, @currentSpecVersion, @currentPlanVersion, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          problem_statement = excluded.problem_statement,
          constraints_json = excluded.constraints_json,
          desired_outcomes_json = excluded.desired_outcomes_json,
          state = excluded.state,
          current_spec_version = excluded.current_spec_version,
          current_plan_version = excluded.current_plan_version,
          updated_at = excluded.updated_at
      `)
      .run({
        ...session,
        constraintsJson: JSON.stringify(session.constraints),
        desiredOutcomesJson: JSON.stringify(session.desiredOutcomes)
      });
  }

  async findById(id: string): Promise<WorkflowSession | null> {
    const row = this.db.client.prepare("SELECT * FROM workflow_sessions WHERE id = ?").get(id) as SessionRow | undefined;
    return row ? mapSession(row) : null;
  }

  async list(): Promise<WorkflowSession[]> {
    const rows = this.db.client
      .prepare("SELECT * FROM workflow_sessions ORDER BY created_at DESC")
      .all() as SessionRow[];
    return rows.map(mapSession);
  }

  async saveApproval(approval: ApprovalRecord): Promise<void> {
    this.db.client
      .prepare(`
        INSERT INTO approvals (id, session_id, artifact_type, artifact_version, note, created_at)
        VALUES (@id, @sessionId, @artifactType, @artifactVersion, @note, @createdAt)
        ON CONFLICT(session_id, artifact_type, artifact_version) DO UPDATE SET
          note = excluded.note
      `)
      .run(approval);
  }

  async latestApproval(sessionId: string, artifactType: "spec" | "plan"): Promise<ApprovalRecord | null> {
    const row = this.db.client
      .prepare("SELECT * FROM approvals WHERE session_id = ? AND artifact_type = ? ORDER BY artifact_version DESC LIMIT 1")
      .get(sessionId, artifactType) as ApprovalRow | undefined;
    return row ? mapApproval(row) : null;
  }
}

function mapSession(row: SessionRow): WorkflowSession {
  return {
    id: row.id,
    title: row.title,
    problemStatement: row.problem_statement,
    constraints: JSON.parse(row.constraints_json) as string[],
    desiredOutcomes: JSON.parse(row.desired_outcomes_json) as string[],
    state: row.state,
    currentSpecVersion: row.current_spec_version,
    currentPlanVersion: row.current_plan_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapApproval(row: ApprovalRow): ApprovalRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    artifactType: row.artifact_type,
    artifactVersion: row.artifact_version,
    note: row.note,
    createdAt: row.created_at
  };
}
