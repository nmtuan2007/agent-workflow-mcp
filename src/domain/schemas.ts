import { z } from "zod";

export const workflowStateSchema = z.enum([
  "IDEA",
  "DISCOVERY",
  "SPEC_DRAFT",
  "SPEC_REVIEW",
  "SPEC_APPROVED",
  "PLAN_DRAFT",
  "PLAN_APPROVED",
  "EXECUTING",
  "REVIEW_PENDING",
  "REVIEW_FAILED",
  "REVIEW_PASSED",
  "VERIFY_PENDING",
  "VERIFIED",
  "BLOCKED",
  "FINISHED"
]);

export const artifactTypeSchema = z.enum([
  "brief",
  "spec",
  "plan",
  "review",
  "verification",
  "decision-log"
]);

export const workflowSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  problemStatement: z.string(),
  constraints: z.array(z.string()),
  desiredOutcomes: z.array(z.string()),
  state: workflowStateSchema,
  currentSpecVersion: z.number().int().positive().nullable(),
  currentPlanVersion: z.number().int().positive().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const artifactRecordSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: artifactTypeSchema,
  version: z.number().int().positive(),
  format: z.enum(["markdown", "json"]),
  content: z.string(),
  metadataJson: z.string(),
  createdAt: z.string()
});

export const evidenceInputSchema = z.object({
  kind: z.enum(["test-result", "diff-summary", "log-snippet", "manual-checklist"]),
  content: z.string().min(1)
});

export const workflowTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  goal: z.string(),
  files: z.array(z.string()),
  acceptance_criteria: z.array(z.string()),
  verification_steps: z.array(z.string()),
  dependencies: z.array(z.string()),
  caution_notes: z.array(z.string()).optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional()
});

export const startWorkflowInputSchema = z.object({
  title: z.string().min(1),
  problem_statement: z.string().min(1),
  constraints: z.array(z.string()).default([]),
  desired_outcomes: z.array(z.string()).default([])
});

export const captureConstraintsInputSchema = z.object({
  session_id: z.string(),
  constraints: z.array(z.string()).default([]),
  desired_outcomes: z.array(z.string()).default([]),
  mode: z.enum(["append", "replace"]).default("append")
});

export const generateSpecInputSchema = z.object({
  session_id: z.string(),
  spec_intent: z.enum(["initial", "revision"]).default("initial"),
  notes: z.string().default("")
});

export const approveSpecInputSchema = z.object({
  session_id: z.string(),
  version: z.number().int().positive(),
  approval_note: z.string().default("")
});

export const generatePlanInputSchema = z.object({
  session_id: z.string(),
  planning_mode: z.string().default("task-breakdown"),
  notes: z.string().default("")
});

export const approvePlanInputSchema = z.object({
  session_id: z.string(),
  version: z.number().int().positive(),
  approval_note: z.string().default("")
});

export const sessionOnlyInputSchema = z.object({
  session_id: z.string()
});

export const reviewArtifactInputSchema = z.object({
  session_id: z.string(),
  artifact_ref: z.string(),
  summary: z.string().min(1),
  verdict: z.enum(["pass", "fail"]).default("pass"),
  evidence: z.array(evidenceInputSchema).default([])
});

export const verifyArtifactInputSchema = z.object({
  session_id: z.string(),
  artifact_ref: z.string(),
  verification_checks: z.array(z.string()).default([])
});

export const finishWorkflowInputSchema = z.object({
  session_id: z.string(),
  closing_note: z.string().default("")
});
