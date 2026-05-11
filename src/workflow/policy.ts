import { invalidTransition, missingArtifact } from "../domain/errors.js";
import { ArtifactRecord, WorkflowSession } from "../domain/types.js";

export const allToolActions = [
  "capture_constraints",
  "generate_spec",
  "approve_spec",
  "generate_plan",
  "approve_plan",
  "get_next_task",
  "review_artifact",
  "verify_artifact",
  "finish_workflow"
] as const;

export function recommendedAction(session: WorkflowSession): string | null {
  switch (session.state) {
    case "DISCOVERY":
    case "SPEC_DRAFT":
    case "SPEC_REVIEW":
      return "generate_spec";
    case "SPEC_APPROVED":
      return "generate_plan";
    case "PLAN_DRAFT":
      return "approve_plan";
    case "PLAN_APPROVED":
      return "get_next_task";
    case "EXECUTING":
    case "REVIEW_PENDING":
    case "REVIEW_FAILED":
      return "review_artifact";
    case "REVIEW_PASSED":
    case "VERIFY_PENDING":
      return "verify_artifact";
    case "VERIFIED":
      return "finish_workflow";
    case "BLOCKED":
      return "capture_constraints";
    default:
      return null;
  }
}

export function allowedActions(session: WorkflowSession): string[] {
  const actions: string[] = session.state === "FINISHED" ? [] : ["capture_constraints"];
  if (["DISCOVERY", "SPEC_DRAFT", "SPEC_REVIEW"].includes(session.state)) actions.push("generate_spec");
  if (session.state === "SPEC_REVIEW" && session.currentSpecVersion !== null) actions.push("approve_spec");
  if (["SPEC_APPROVED", "PLAN_DRAFT"].includes(session.state)) actions.push("generate_plan");
  if (session.state === "PLAN_DRAFT" && session.currentPlanVersion !== null) actions.push("approve_plan");
  if (["PLAN_APPROVED", "EXECUTING", "REVIEW_PENDING", "REVIEW_FAILED", "REVIEW_PASSED", "VERIFY_PENDING", "VERIFIED"].includes(session.state)) {
    actions.push("get_next_task", "review_artifact", "verify_artifact");
  }
  if (session.state === "VERIFIED") actions.push("finish_workflow");
  return [...new Set(actions)];
}

export function assertCanGenerateSpec(session: WorkflowSession): void {
  if (!["DISCOVERY", "SPEC_DRAFT", "SPEC_REVIEW"].includes(session.state)) {
    throw invalidTransition(session.state, "generate_spec", allowedActions(session));
  }
}

export function assertCanApproveSpec(session: WorkflowSession, latestSpec: ArtifactRecord | null): void {
  if (!latestSpec) throw missingArtifact("Cannot approve spec because no spec artifact exists.");
  if (session.state !== "SPEC_REVIEW") {
    throw invalidTransition(session.state, "approve_spec", allowedActions(session));
  }
}

export function assertCanGeneratePlan(session: WorkflowSession): void {
  if (!["SPEC_APPROVED", "PLAN_DRAFT"].includes(session.state)) {
    throw invalidTransition(session.state, "generate_plan", allowedActions(session));
  }
  if (session.currentSpecVersion === null) {
    throw missingArtifact("Cannot generate a plan before a spec is approved.");
  }
}

export function assertCanApprovePlan(session: WorkflowSession, latestPlan: ArtifactRecord | null): void {
  if (!latestPlan) throw missingArtifact("Cannot approve plan because no plan artifact exists.");
  if (session.state !== "PLAN_DRAFT") {
    throw invalidTransition(session.state, "approve_plan", allowedActions(session));
  }
}

export function assertCanExecute(session: WorkflowSession, action: string): void {
  if (session.currentPlanVersion === null || !["PLAN_APPROVED", "EXECUTING", "REVIEW_PENDING", "REVIEW_FAILED", "REVIEW_PASSED", "VERIFY_PENDING", "VERIFIED"].includes(session.state)) {
    throw invalidTransition(session.state, action, allowedActions(session));
  }
}

export function assertCanVerify(session: WorkflowSession, hasReview: boolean, hasEvidence: boolean): void {
  if (!hasReview || !hasEvidence) {
    throw missingArtifact("Cannot verify before a passing review and matching evidence exist.");
  }
  assertCanExecute(session, "verify_artifact");
}

export function assertCanFinish(session: WorkflowSession): void {
  if (session.state !== "VERIFIED") {
    throw invalidTransition(session.state, "finish_workflow", allowedActions(session));
  }
}
