import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactRepository } from "../src/storage/repositories/artifactRepository.js";
import { WorkflowRepository } from "../src/storage/repositories/workflowRepository.js";
import { createDatabase } from "../src/storage/sqlite.js";
import { WorkflowService } from "../src/workflow/service.js";

export async function testContext() {
  const dir = mkdtempSync(join(tmpdir(), "workflow-mcp-"));
  const db = await createDatabase(join(dir, "test.db"));
  await db.init();
  const workflows = new WorkflowRepository(db);
  const artifacts = new ArtifactRepository(db);
  const service = new WorkflowService(workflows, artifacts);
  return { db, workflows, artifacts, service };
}
