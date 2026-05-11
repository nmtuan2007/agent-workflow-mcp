import { WorkflowService } from "../../workflow/service.js";

export function sessionSummaryResource(service: WorkflowService, sessionId: string): Promise<string> {
  return service.getSummary(sessionId);
}
