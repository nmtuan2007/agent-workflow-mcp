import { WorkflowService } from "../../workflow/service.js";

export function tasksResource(service: WorkflowService, sessionId: string): Promise<string> {
  return service.latestTasksJson(sessionId);
}
