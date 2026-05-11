import { WorkflowState } from "../domain/types.js";

const transitions: Record<WorkflowState, WorkflowState[]> = {
  IDEA: ["DISCOVERY"],
  DISCOVERY: ["SPEC_DRAFT", "SPEC_REVIEW"],
  SPEC_DRAFT: ["SPEC_REVIEW", "SPEC_DRAFT"],
  SPEC_REVIEW: ["SPEC_APPROVED", "SPEC_DRAFT", "SPEC_REVIEW"],
  SPEC_APPROVED: ["PLAN_DRAFT"],
  PLAN_DRAFT: ["PLAN_APPROVED", "PLAN_DRAFT"],
  PLAN_APPROVED: ["EXECUTING", "REVIEW_PENDING"],
  EXECUTING: ["REVIEW_PENDING", "BLOCKED"],
  REVIEW_PENDING: ["REVIEW_FAILED", "REVIEW_PASSED"],
  REVIEW_FAILED: ["EXECUTING", "REVIEW_PENDING", "BLOCKED"],
  REVIEW_PASSED: ["VERIFY_PENDING", "VERIFIED"],
  VERIFY_PENDING: ["VERIFIED", "BLOCKED"],
  VERIFIED: ["FINISHED", "EXECUTING"],
  BLOCKED: ["EXECUTING", "SPEC_DRAFT", "PLAN_DRAFT"],
  FINISHED: []
};

export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return transitions[from].includes(to);
}

export function allowedTransitions(from: WorkflowState): WorkflowState[] {
  return transitions[from];
}
