import { generateSpecInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const generateSpecTool = {
  name: "generate_spec",
  title: "Generate Spec",
  description: "Generate or revise a structured engineering spec artifact.",
  schema: generateSpecInputSchema,
  handler: (service: WorkflowService) => service.generateSpec.bind(service)
};
