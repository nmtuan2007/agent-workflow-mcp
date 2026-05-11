import { describe, expect, it } from "vitest";
import { testContext } from "./helpers.js";

describe("tool contracts via workflow service", () => {
  it("start_workflow creates a session", async () => {
    const { service, db } = await testContext();
    const result = await service.startWorkflow({
      title: "Magic link authentication",
      problem_statement: "Users need passwordless login",
      constraints: ["Existing Node.js codebase"],
      desired_outcomes: ["Approved spec"]
    });
    expect(result.session_id).toMatch(/^wf_/);
    expect(result.status).toBe("DISCOVERY");
    expect(result.next_recommended_action).toBe("generate_spec");
    await db.close();
  });

  it("generate_plan fails if spec is not approved", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await expect(service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" })).rejects.toMatchObject({
      payload: { code: "INVALID_TRANSITION", attempted_action: "generate_plan" }
    });
    await db.close();
  });

  it("finish_workflow fails if not verified", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await expect(service.finishWorkflow({ session_id: start.session_id, closing_note: "" })).rejects.toMatchObject({
      payload: { code: "INVALID_TRANSITION", attempted_action: "finish_workflow" }
    });
    await db.close();
  });

  it("rejects spec approval after the workflow has moved past spec review", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    await service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "" });
    await expect(service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "late" })).rejects.toMatchObject({
      payload: { code: "INVALID_TRANSITION", attempted_action: "approve_spec" }
    });
    await db.close();
  });

  it("rejects plan approval after execution has started", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    await service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.getNextTask({ session_id: start.session_id });
    await expect(service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "late" })).rejects.toMatchObject({
      payload: { code: "INVALID_TRANSITION", attempted_action: "approve_plan" }
    });
    await db.close();
  });

  it("get_next_task returns task from latest approved plan", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Magic link authentication",
      problem_statement: "Users need passwordless login",
      constraints: ["Existing Node.js codebase"],
      desired_outcomes: ["Approved plan"]
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    await service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "" });
    const next = await service.getNextTask({ session_id: start.session_id });
    expect(next.task.id).toBe("T1");
    expect(next.state).toBe("EXECUTING");
    await db.close();
  });

  it("records failed reviews and blocks verification", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    await service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.getNextTask({ session_id: start.session_id });
    const review = await service.reviewArtifact({
      session_id: start.session_id,
      artifact_ref: "task:T1",
      summary: "Needs changes",
      verdict: "fail",
      evidence: [{ kind: "test-result", content: "failing test" }]
    });
    expect(review.state).toBe("REVIEW_FAILED");
    expect(review.verdict).toBe("fail");
    await expect(service.verifyArtifact({
      session_id: start.session_id,
      artifact_ref: "task:T1",
      verification_checks: ["Tests passed"]
    })).rejects.toMatchObject({
      payload: { code: "MISSING_ARTIFACT" }
    });
    await db.close();
  });

  it("requires verification evidence to match the reviewed artifact", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    await service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "" });
    await service.getNextTask({ session_id: start.session_id });
    await service.reviewArtifact({
      session_id: start.session_id,
      artifact_ref: "task:T1",
      summary: "Looks good",
      verdict: "pass",
      evidence: [{ kind: "test-result", content: "passed" }]
    });
    await expect(service.verifyArtifact({
      session_id: start.session_id,
      artifact_ref: "task:T2",
      verification_checks: ["Tests passed"]
    })).rejects.toMatchObject({
      payload: { code: "MISSING_ARTIFACT" }
    });
    await db.close();
  });

  it("moves through the full workflow", async () => {
    const { service, workflows, artifacts, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Magic link authentication",
      problem_statement: "Users need passwordless login",
      constraints: ["Existing Node.js codebase"],
      desired_outcomes: ["Verification checklist"]
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "ok" });
    await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    await service.approvePlan({ session_id: start.session_id, version: 1, approval_note: "ok" });
    await service.getNextTask({ session_id: start.session_id });
    await service.reviewArtifact({
      session_id: start.session_id,
      artifact_ref: "task:T1",
      summary: "Implemented",
      evidence: [{ kind: "test-result", content: "1 passed" }]
    });
    await service.verifyArtifact({
      session_id: start.session_id,
      artifact_ref: "task:T1",
      verification_checks: ["Tests passed"]
    });
    const finished = await service.finishWorkflow({ session_id: start.session_id, closing_note: "done" });
    expect(finished.state).toBe("FINISHED");
    expect(await workflows.latestApproval(start.session_id, "spec")).toMatchObject({ artifactVersion: 1 });
    expect(await workflows.latestApproval(start.session_id, "plan")).toMatchObject({ artifactVersion: 1 });
    expect(await artifacts.listEvidence(start.session_id)).toHaveLength(1);
    await expect(service.captureConstraints({
      session_id: start.session_id,
      constraints: ["too late"],
      desired_outcomes: [],
      mode: "append"
    })).rejects.toMatchObject({
      payload: { code: "INVALID_TRANSITION", attempted_action: "capture_constraints" }
    });
    await db.close();
  });
});
