import { WorkflowService } from "../../workflow/service.js";

export async function planResource(service: WorkflowService, sessionId: string): Promise<string> {
  return (await service.latestArtifact(sessionId, "plan")).content;
}
