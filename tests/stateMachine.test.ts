import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition } from "../src/workflow/stateMachine.js";
import { testContext } from "./helpers.js";

describe("state machine", () => {
  it("allows the valid flow from discovery to finished", () => {
    expect(canTransition("DISCOVERY", "SPEC_REVIEW")).toBe(true);
    expect(canTransition("SPEC_REVIEW", "SPEC_APPROVED")).toBe(true);
    expect(canTransition("SPEC_APPROVED", "PLAN_DRAFT")).toBe(true);
    expect(canTransition("PLAN_DRAFT", "PLAN_APPROVED")).toBe(true);
    expect(canTransition("PLAN_APPROVED", "EXECUTING")).toBe(true);
    expect(canTransition("EXECUTING", "REVIEW_PENDING")).toBe(true);
    expect(canTransition("REVIEW_PENDING", "REVIEW_PASSED")).toBe(true);
    expect(canTransition("REVIEW_PASSED", "VERIFIED")).toBe(true);
    expect(canTransition("VERIFIED", "FINISHED")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("DISCOVERY", "PLAN_DRAFT")).toBe(false);
    expect(allowedTransitions("FINISHED")).toEqual([]);
  });

  it("increments spec revisions", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    const first = await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    const second = await service.generateSpec({ session_id: start.session_id, spec_intent: "revision", notes: "revise" });
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    await db.close();
  });

  it("increments plan revisions", async () => {
    const { service, db } = await testContext();
    const start = await service.startWorkflow({
      title: "Feature",
      problem_statement: "Need a thing",
      constraints: [],
      desired_outcomes: []
    });
    await service.generateSpec({ session_id: start.session_id, spec_intent: "initial", notes: "" });
    await service.approveSpec({ session_id: start.session_id, version: 1, approval_note: "" });
    const first = await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "" });
    const second = await service.generatePlan({ session_id: start.session_id, planning_mode: "task-breakdown", notes: "revise" });
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    await db.close();
  });
});
