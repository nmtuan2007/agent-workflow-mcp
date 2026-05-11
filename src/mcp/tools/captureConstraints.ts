import { captureConstraintsInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const captureConstraintsTool = {
  name: "capture_constraints",
  title: "Capture Constraints",
  description: "Append or replace constraints and desired outcomes for a workflow.",
  schema: captureConstraintsInputSchema,
  handler: (service: WorkflowService) => service.captureConstraints.bind(service)
};
