import { verifyArtifactInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const verifyArtifactTool = {
  name: "verify_artifact",
  title: "Verify Artifact",
  description: "Check whether evidence is sufficient to consider work complete.",
  schema: verifyArtifactInputSchema,
  handler: (service: WorkflowService) => service.verifyArtifact.bind(service)
};
