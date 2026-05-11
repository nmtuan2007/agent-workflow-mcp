import { generatePlanInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const generatePlanTool = {
  name: "generate_plan",
  title: "Generate Plan",
  description: "Generate an implementation plan derived from the approved spec.",
  schema: generatePlanInputSchema,
  handler: (service: WorkflowService) => service.generatePlan.bind(service)
};
