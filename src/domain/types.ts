export type WorkflowState =
  | "IDEA"
  | "DISCOVERY"
  | "SPEC_DRAFT"
  | "SPEC_REVIEW"
  | "SPEC_APPROVED"
  | "PLAN_DRAFT"
  | "PLAN_APPROVED"
  | "EXECUTING"
  | "REVIEW_PENDING"
  | "REVIEW_FAILED"
  | "REVIEW_PASSED"
  | "VERIFY_PENDING"
  | "VERIFIED"
  | "BLOCKED"
  | "FINISHED";

export interface WorkflowSession {
  id: string;
  title: string;
  problemStatement: string;
  constraints: string[];
  desiredOutcomes: string[];
  state: WorkflowState;
  currentSpecVersion: number | null;
  currentPlanVersion: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ArtifactType =
  | "brief"
  | "spec"
  | "plan"
  | "review"
  | "verification"
  | "decision-log";

export interface ArtifactRecord {
  id: string;
  sessionId: string;
  type: ArtifactType;
  version: number;
  format: "markdown" | "json";
  content: string;
  metadataJson: string;
  createdAt: string;
}

export interface EvidenceRecord {
  id: string;
  sessionId: string;
  artifactType: string;
  artifactVersion: number | null;
  kind: "test-result" | "diff-summary" | "log-snippet" | "manual-checklist";
  content: string;
  createdAt: string;
}

export interface ApprovalRecord {
  id: string;
  sessionId: string;
  artifactType: "spec" | "plan";
  artifactVersion: number;
  note: string;
  createdAt: string;
}

export interface WorkflowTask {
  id: string;
  title: string;
  goal: string;
  files: string[];
  acceptance_criteria: string[];
  verification_steps: string[];
  dependencies: string[];
  caution_notes?: string[];
  status?: "todo" | "in-progress" | "done";
}
