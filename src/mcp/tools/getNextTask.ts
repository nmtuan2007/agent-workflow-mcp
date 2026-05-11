import { sessionOnlyInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const getNextTaskTool = {
  name: "get_next_task",
  title: "Get Next Task",
  description: "Return the next best executable task from the current approved plan.",
  schema: sessionOnlyInputSchema,
  handler: (service: WorkflowService) => service.getNextTask.bind(service)
};
