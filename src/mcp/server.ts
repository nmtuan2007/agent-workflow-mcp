import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ArtifactRepository } from "../storage/repositories/artifactRepository.js";
import { WorkflowRepository } from "../storage/repositories/workflowRepository.js";
import { Database } from "../storage/sqlite.js";
import { WorkflowService } from "../workflow/service.js";
import { registerPrompts } from "./registerPrompts.js";
import { registerResources } from "./registerResources.js";
import { registerTools } from "./registerTools.js";

export interface AppDeps {
  db: Database;
  workflowRepository: WorkflowRepository;
  artifactRepository: ArtifactRepository;
  workflowService: WorkflowService;
}

export function createDeps(db: Database): AppDeps {
  const workflowRepository = new WorkflowRepository(db);
  const artifactRepository = new ArtifactRepository(db);
  const workflowService = new WorkflowService(workflowRepository, artifactRepository);
  return { db, workflowRepository, artifactRepository, workflowService };
}

export async function createMcpServer(deps: AppDeps): Promise<McpServer> {
  const server = new McpServer({
    name: "agent-workflow-mcp",
    version: "0.1.0"
  });

  await registerTools(server, deps);
  await registerResources(server, deps);
  await registerPrompts(server, deps);
  return server;
}
