import { z } from "zod";

export const requestCodeReviewPrompt = {
  name: "request_code_review",
  title: "Request Code Review",
  description: "Generate a review-oriented message for a task or plan artifact.",
  schema: {
    session_id: z.string(),
    artifact_ref: z.string(),
    summary: z.string()
  },
  text: (args: Record<string, unknown>) => `Review artifact ${args.artifact_ref} for workflow session ${args.session_id}.

Summary: ${args.summary}

Check conformance to the approved plan, evidence quality, regressions, test coverage, maintainability, and unresolved risks.`
};
