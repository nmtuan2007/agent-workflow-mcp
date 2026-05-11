import { WorkflowService } from "../../workflow/service.js";

export async function reviewResource(service: WorkflowService, sessionId: string): Promise<string> {
  return (await service.latestArtifact(sessionId, "review")).content;
}
