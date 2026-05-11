import { WorkflowService } from "../../workflow/service.js";

export async function sessionsResource(service: WorkflowService): Promise<string> {
  const sessions = await service.listSessions();
  return JSON.stringify(
    sessions.map((session) => ({
      id: session.id,
      title: session.title,
      state: session.state,
      summary_uri: `workflow://sessions/${session.id}/summary`
    })),
    null,
    2
  );
}
