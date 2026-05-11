import { approvePlanInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const approvePlanTool = {
  name: "approve_plan",
  title: "Approve Plan",
  description: "Approve a plan version.",
  schema: approvePlanInputSchema,
  handler: (service: WorkflowService) => service.approvePlan.bind(service)
};
