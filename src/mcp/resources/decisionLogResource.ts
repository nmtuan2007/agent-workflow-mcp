import { WorkflowService } from "../../workflow/service.js";

export async function decisionLogResource(service: WorkflowService, sessionId: string): Promise<string> {
  return (await service.latestArtifact(sessionId, "decision-log")).content;
}
