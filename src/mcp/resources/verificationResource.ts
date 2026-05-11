import { WorkflowService } from "../../workflow/service.js";

export async function verificationResource(service: WorkflowService, sessionId: string): Promise<string> {
  return (await service.latestArtifact(sessionId, "verification")).content;
}
