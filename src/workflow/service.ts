import { invalidSession, missingArtifact } from "../domain/errors.js";
import {
  ArtifactRecord,
  EvidenceRecord,
  WorkflowSession,
  WorkflowTask
} from "../domain/types.js";
import {
  approvePlanInputSchema,
  approveSpecInputSchema,
  captureConstraintsInputSchema,
  finishWorkflowInputSchema,
  generatePlanInputSchema,
  generateSpecInputSchema,
  reviewArtifactInputSchema,
  sessionOnlyInputSchema,
  startWorkflowInputSchema,
  verifyArtifactInputSchema
} from "../domain/schemas.js";
import { ArtifactRepository } from "../storage/repositories/artifactRepository.js";
import { WorkflowRepository } from "../storage/repositories/workflowRepository.js";
import { briefMarkdown, defaultTasks, planMarkdown, specMarkdown } from "../utils/markdown.js";
import { recordId, workflowId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import {
  assertCanApprovePlan,
  assertCanApproveSpec,
  assertCanExecute,
  assertCanFinish,
  assertCanGeneratePlan,
  assertCanGenerateSpec,
  assertCanVerify,
  recommendedAction
} from "./policy.js";

export class WorkflowService {
  constructor(
    private readonly workflows: WorkflowRepository,
    private readonly artifacts: ArtifactRepository
  ) {}

  async startWorkflow(input: unknown) {
    const data = startWorkflowInputSchema.parse(input);
    const timestamp = nowIso();
    const session: WorkflowSession = {
      id: workflowId(),
      title: data.title,
      problemStatement: data.problem_statement,
      constraints: data.constraints,
      desiredOutcomes: data.desired_outcomes,
      state: "DISCOVERY",
      currentSpecVersion: null,
      currentPlanVersion: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await this.workflows.save(session);
    await this.artifacts.save(this.artifact(session, "brief", 1, "markdown", briefMarkdown(session), {}));
    await this.artifacts.save(this.artifact(session, "decision-log", 1, "markdown", `# Decision Log: ${session.title}\n\n- ${timestamp}: Workflow started.\n`, {}));
    return {
      session_id: session.id,
      status: session.state,
      artifact_uris: { summary: `workflow://sessions/${session.id}/summary` },
      next_recommended_action: "generate_spec"
    };
  }

  async captureConstraints(input: unknown) {
    const data = captureConstraintsInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    const updated: WorkflowSession = {
      ...session,
      constraints: data.mode === "replace" ? data.constraints : [...session.constraints, ...data.constraints],
      desiredOutcomes: data.mode === "replace" ? data.desired_outcomes : [...session.desiredOutcomes, ...data.desired_outcomes],
      updatedAt: nowIso()
    };
    await this.workflows.save(updated);
    return {
      session_id: updated.id,
      status: updated.state,
      updated: true,
      next_recommended_action: recommendedAction(updated)
    };
  }

  async generateSpec(input: unknown) {
    const data = generateSpecInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    assertCanGenerateSpec(session);
    const version = await this.artifacts.nextVersion(session.id, "spec");
    await this.artifacts.save(this.artifact(session, "spec", version, "markdown", specMarkdown(session, version, data.notes), {
      intent: data.spec_intent,
      notes: data.notes
    }));
    const updated = { ...session, state: "SPEC_REVIEW" as const, currentSpecVersion: version, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      artifact_type: "spec",
      version,
      artifact_uri: `workflow://sessions/${session.id}/spec`,
      state: updated.state,
      next_recommended_action: "approve_spec"
    };
  }

  async approveSpec(input: unknown) {
    const data = approveSpecInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    const latest = await this.artifacts.latest(session.id, "spec");
    assertCanApproveSpec(session, latest);
    const spec = await this.artifacts.byVersion(session.id, "spec", data.version);
    if (!spec) throw missingArtifact(`Spec v${data.version} does not exist.`);
    await this.workflows.saveApproval({
      id: recordId("appr"),
      sessionId: session.id,
      artifactType: "spec",
      artifactVersion: data.version,
      note: data.approval_note,
      createdAt: nowIso()
    });
    const updated = { ...session, state: "SPEC_APPROVED" as const, currentSpecVersion: data.version, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      approved_spec_version: data.version,
      state: updated.state,
      next_recommended_action: "generate_plan"
    };
  }

  async generatePlan(input: unknown) {
    const data = generatePlanInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    assertCanGeneratePlan(session);
    const version = await this.artifacts.nextVersion(session.id, "plan");
    const tasks = defaultTasks(session);
    await this.artifacts.save(this.artifact(session, "plan", version, "markdown", planMarkdown(session, version, tasks, data.notes), {
      planning_mode: data.planning_mode,
      notes: data.notes,
      tasks: tasks.map((task) => ({ ...task, status: task.status ?? "todo" }))
    }));
    const updated = { ...session, state: "PLAN_DRAFT" as const, currentPlanVersion: version, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      artifact_type: "plan",
      version,
      artifact_uri: `workflow://sessions/${session.id}/plan`,
      state: updated.state,
      next_recommended_action: "approve_plan"
    };
  }

  async approvePlan(input: unknown) {
    const data = approvePlanInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    const latest = await this.artifacts.latest(session.id, "plan");
    assertCanApprovePlan(session, latest);
    const plan = await this.artifacts.byVersion(session.id, "plan", data.version);
    if (!plan) throw missingArtifact(`Plan v${data.version} does not exist.`);
    await this.workflows.saveApproval({
      id: recordId("appr"),
      sessionId: session.id,
      artifactType: "plan",
      artifactVersion: data.version,
      note: data.approval_note,
      createdAt: nowIso()
    });
    const updated = { ...session, state: "PLAN_APPROVED" as const, currentPlanVersion: data.version, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      approved_plan_version: data.version,
      state: updated.state,
      next_recommended_action: "get_next_task"
    };
  }

  async getNextTask(input: unknown) {
    const data = sessionOnlyInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    assertCanExecute(session, "get_next_task");
    const tasks = await this.getTasks(session);
    const task = tasks.find((item) => item.status !== "done") ?? tasks[0];
    const updated = { ...session, state: "EXECUTING" as const, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      task,
      state: updated.state,
      next_recommended_action: "review_artifact"
    };
  }

  async reviewArtifact(input: unknown) {
    const data = reviewArtifactInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    assertCanExecute(session, "review_artifact");
    const version = await this.artifacts.nextVersion(session.id, "review");
    for (const item of data.evidence) {
      await this.artifacts.saveEvidence({
        id: recordId("ev"),
        sessionId: session.id,
        artifactType: data.artifact_ref,
        artifactVersion: session.currentPlanVersion,
        kind: item.kind,
        content: item.content,
        createdAt: nowIso()
      });
    }
    await this.artifacts.save(this.artifact(session, "review", version, "markdown", `# Review v${version}: ${data.artifact_ref}

## Summary
${data.summary}

## Evidence
${data.evidence.length ? data.evidence.map((item) => `- ${item.kind}: ${item.content}`).join("\n") : "- No evidence supplied"}

## Verdict
pass
`, { artifact_ref: data.artifact_ref, verdict: "pass" }));
    const updated = { ...session, state: "REVIEW_PASSED" as const, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      artifact_type: "review",
      version,
      state: updated.state,
      verdict: "pass",
      next_recommended_action: "verify_artifact"
    };
  }

  async verifyArtifact(input: unknown) {
    const data = verifyArtifactInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    const latestReview = await this.artifacts.latest(session.id, "review");
    const evidence = await this.artifacts.listEvidence(session.id);
    assertCanVerify(session, Boolean(latestReview), evidence.length > 0);
    const version = await this.artifacts.nextVersion(session.id, "verification");
    await this.artifacts.save(this.artifact(session, "verification", version, "markdown", `# Verification v${version}: ${data.artifact_ref}

## Checks
${data.verification_checks.length ? data.verification_checks.map((check) => `- [x] ${check}`).join("\n") : "- [x] Review or evidence exists"}

## Evidence Count
${evidence.length}

## Verdict
pass
`, { artifact_ref: data.artifact_ref, verdict: "pass" }));
    const updated = { ...session, state: "VERIFIED" as const, updatedAt: nowIso() };
    await this.workflows.save(updated);
    return {
      session_id: session.id,
      artifact_type: "verification",
      version,
      state: updated.state,
      verdict: "pass",
      next_recommended_action: "finish_workflow"
    };
  }

  async finishWorkflow(input: unknown) {
    const data = finishWorkflowInputSchema.parse(input);
    const session = await this.getSession(data.session_id);
    assertCanFinish(session);
    const updated = { ...session, state: "FINISHED" as const, updatedAt: nowIso() };
    await this.workflows.save(updated);
    await this.artifacts.save(this.artifact(updated, "decision-log", await this.artifacts.nextVersion(session.id, "decision-log"), "markdown", `# Closing Note

${data.closing_note || "Workflow complete"}
`, {}));
    return {
      session_id: session.id,
      state: updated.state,
      summary_uri: `workflow://sessions/${session.id}/summary`
    };
  }

  async listSessions(): Promise<WorkflowSession[]> {
    return this.workflows.list();
  }

  async getSummary(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    return `# Workflow Summary: ${session.title}

- State: ${session.state}
- Problem: ${session.problemStatement}
- Current spec version: ${session.currentSpecVersion ?? "none"}
- Current plan version: ${session.currentPlanVersion ?? "none"}
- Next recommended action: ${recommendedAction(session) ?? "none"}
`;
  }

  async latestArtifact(sessionId: string, type: "brief" | "spec" | "plan" | "review" | "verification" | "decision-log"): Promise<ArtifactRecord> {
    await this.getSession(sessionId);
    const artifact = await this.artifacts.latest(sessionId, type);
    if (!artifact) throw missingArtifact(`No ${type} artifact exists for ${sessionId}.`);
    return artifact;
  }

  async latestTasksJson(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    return JSON.stringify({
      session_id: session.id,
      plan_version: session.currentPlanVersion,
      tasks: await this.getTasks(session)
    }, null, 2);
  }

  private async getSession(sessionId: string): Promise<WorkflowSession> {
    const session = await this.workflows.findById(sessionId);
    if (!session) throw invalidSession(sessionId);
    return session;
  }

  private async getTasks(session: WorkflowSession): Promise<WorkflowTask[]> {
    if (session.currentPlanVersion === null) throw missingArtifact("No approved plan version is available.");
    const plan = await this.artifacts.byVersion(session.id, "plan", session.currentPlanVersion);
    if (!plan) return defaultTasks(session);
    const parsed = JSON.parse(plan.metadataJson) as { tasks?: WorkflowTask[] };
    return parsed.tasks ?? defaultTasks(session);
  }

  private artifact(
    session: WorkflowSession,
    type: ArtifactRecord["type"],
    version: number,
    format: ArtifactRecord["format"],
    content: string,
    metadata: Record<string, unknown>
  ): ArtifactRecord {
    return {
      id: recordId("art"),
      sessionId: session.id,
      type,
      version,
      format,
      content,
      metadataJson: JSON.stringify(metadata),
      createdAt: nowIso()
    };
  }
}
