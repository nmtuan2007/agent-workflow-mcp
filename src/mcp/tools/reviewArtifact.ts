import { reviewArtifactInputSchema } from "../../domain/schemas.js";
import { WorkflowService } from "../../workflow/service.js";

export const reviewArtifactTool = {
  name: "review_artifact",
  title: "Review Artifact",
  description: "Create a structured review artifact against a plan or task.",
  schema: reviewArtifactInputSchema,
  handler: (service: WorkflowService) => service.reviewArtifact.bind(service)
};
