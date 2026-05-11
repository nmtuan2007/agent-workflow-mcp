import { WorkflowService } from "../../workflow/service.js";

export async function specResource(service: WorkflowService, sessionId: string): Promise<string> {
  return (await service.latestArtifact(sessionId, "spec")).content;
}
