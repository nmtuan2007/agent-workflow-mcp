import { WorkflowState } from "./types.js";

export type WorkflowErrorCode =
  | "INVALID_SESSION"
  | "MISSING_ARTIFACT"
  | "INVALID_TRANSITION"
  | "DISALLOWED_OPERATION"
  | "PERSISTENCE_FAILURE";

export interface StructuredErrorPayload {
  code: WorkflowErrorCode;
  message: string;
  current_state?: WorkflowState;
  attempted_action?: string;
  allowed_actions?: string[];
}

export class WorkflowError extends Error {
  readonly payload: StructuredErrorPayload;

  constructor(payload: StructuredErrorPayload) {
    super(payload.message);
    this.name = "WorkflowError";
    this.payload = payload;
  }
}

export function invalidTransition(
  currentState: WorkflowState,
  attemptedAction: string,
  allowedActions: string[]
): WorkflowError {
  return new WorkflowError({
    code: "INVALID_TRANSITION",
    message: `Cannot run ${attemptedAction} from ${currentState}.`,
    current_state: currentState,
    attempted_action: attemptedAction,
    allowed_actions: allowedActions
  });
}

export function missingArtifact(message: string): WorkflowError {
  return new WorkflowError({ code: "MISSING_ARTIFACT", message });
}

export function invalidSession(sessionId: string): WorkflowError {
  return new WorkflowError({
    code: "INVALID_SESSION",
    message: `Workflow session not found: ${sessionId}`
  });
}

export function toStructuredError(error: unknown): StructuredErrorPayload {
  if (error instanceof WorkflowError) return error.payload;
  if (error instanceof Error) {
    return { code: "DISALLOWED_OPERATION", message: error.message };
  }
  return { code: "DISALLOWED_OPERATION", message: String(error) };
}
