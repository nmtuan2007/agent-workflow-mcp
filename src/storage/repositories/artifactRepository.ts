import { ArtifactRecord, ArtifactType, EvidenceRecord } from "../../domain/types.js";
import { Database } from "../sqlite.js";

type ArtifactRow = {
  id: string;
  session_id: string;
  type: ArtifactType;
  version: number;
  format: "markdown" | "json";
  content: string;
  metadata_json: string;
  created_at: string;
};

type EvidenceRow = {
  id: string;
  session_id: string;
  artifact_type: string;
  artifact_version: number | null;
  kind: EvidenceRecord["kind"];
  content: string;
  created_at: string;
};

export class ArtifactRepository {
  constructor(private readonly db: Database) {}

  async save(artifact: ArtifactRecord): Promise<void> {
    this.db.client
      .prepare(`
        INSERT INTO artifacts (id, session_id, type, version, format, content, metadata_json, created_at)
        VALUES (@id, @sessionId, @type, @version, @format, @content, @metadataJson, @createdAt)
      `)
      .run(artifact);
  }

  async latest(sessionId: string, type: ArtifactType): Promise<ArtifactRecord | null> {
    const row = this.db.client
      .prepare("SELECT * FROM artifacts WHERE session_id = ? AND type = ? ORDER BY version DESC LIMIT 1")
      .get(sessionId, type) as ArtifactRow | undefined;
    return row ? mapArtifact(row) : null;
  }

  async byVersion(sessionId: string, type: ArtifactType, version: number): Promise<ArtifactRecord | null> {
    const row = this.db.client
      .prepare("SELECT * FROM artifacts WHERE session_id = ? AND type = ? AND version = ?")
      .get(sessionId, type, version) as ArtifactRow | undefined;
    return row ? mapArtifact(row) : null;
  }

  async listByType(sessionId: string, type: ArtifactType): Promise<ArtifactRecord[]> {
    const rows = this.db.client
      .prepare("SELECT * FROM artifacts WHERE session_id = ? AND type = ? ORDER BY version DESC")
      .all(sessionId, type) as ArtifactRow[];
    return rows.map(mapArtifact);
  }

  async nextVersion(sessionId: string, type: ArtifactType): Promise<number> {
    const row = this.db.client
      .prepare("SELECT MAX(version) as version FROM artifacts WHERE session_id = ? AND type = ?")
      .get(sessionId, type) as { version: number | null };
    return (row.version ?? 0) + 1;
  }

  async saveEvidence(evidence: EvidenceRecord): Promise<void> {
    this.db.client
      .prepare(`
        INSERT INTO evidence (id, session_id, artifact_type, artifact_version, kind, content, created_at)
        VALUES (@id, @sessionId, @artifactType, @artifactVersion, @kind, @content, @createdAt)
      `)
      .run(evidence);
  }

  async listEvidence(sessionId: string): Promise<EvidenceRecord[]> {
    const rows = this.db.client
      .prepare("SELECT * FROM evidence WHERE session_id = ? ORDER BY created_at DESC")
      .all(sessionId) as EvidenceRow[];
    return rows.map(mapEvidence);
  }
}

function mapArtifact(row: ArtifactRow): ArtifactRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    type: row.type,
    version: row.version,
    format: row.format,
    content: row.content,
    metadataJson: row.metadata_json,
    createdAt: row.created_at
  };
}

function mapEvidence(row: EvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    artifactType: row.artifact_type,
    artifactVersion: row.artifact_version,
    kind: row.kind,
    content: row.content,
    createdAt: row.created_at
  };
}
