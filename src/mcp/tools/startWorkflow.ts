import { startWorkflowInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const startWorkflowTool = {
  name: "start_workflow",
  title: "Start Workflow",
  description: "Create a new workflow session from a rough engineering idea.",
  schema: startWorkflowInputSchema,
  handler: (service: WorkflowService) => service.startWorkflow.bind(service)
};
