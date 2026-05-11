import { WorkflowService } from "../../workflow/service.js";

export async function briefResource(service: WorkflowService, sessionId: string): Promise<string> {
  return (await service.latestArtifact(sessionId, "brief")).content;
}
