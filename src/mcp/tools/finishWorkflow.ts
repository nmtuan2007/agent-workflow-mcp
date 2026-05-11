import { finishWorkflowInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const finishWorkflowTool = {
  name: "finish_workflow",
  title: "Finish Workflow",
  description: "Complete the workflow only if verification exists.",
  schema: finishWorkflowInputSchema,
  handler: (service: WorkflowService) => service.finishWorkflow.bind(service)
};
