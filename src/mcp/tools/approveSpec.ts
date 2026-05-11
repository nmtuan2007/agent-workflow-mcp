import { approveSpecInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const approveSpecTool = {
  name: "approve_spec",
  title: "Approve Spec",
  description: "Mark a specific spec version as approved and move workflow forward.",
  schema: approveSpecInputSchema,
  handler: (service: WorkflowService) => service.approveSpec.bind(service)
};
