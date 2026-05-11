import { WorkflowSession, WorkflowTask } from "../domain/types.js";

export function briefMarkdown(session: WorkflowSession): string {
  return `# Brief: ${session.title}

## Problem
${session.problemStatement}

## Constraints
${list(session.constraints)}

## Desired Outcomes
${list(session.desiredOutcomes)}
`;
}

export function specMarkdown(session: WorkflowSession, version: number, notes: string): string {
  return `# Spec v${version}: ${session.title}

## Problem
${session.problemStatement}

## Goals
${list(session.desiredOutcomes)}

## Non-goals
- To be confirmed during review

## Constraints
${list(session.constraints)}

## Assumptions
- Implementation details will be validated before execution

## Proposed Architecture
${notes || "Describe the intended architecture, data flow, and integration boundaries."}

## Risks
- Unknown implementation risks must be surfaced before plan approval

## Rollout Strategy
- Prefer incremental rollout with clear rollback criteria

## Acceptance Criteria
${list(session.desiredOutcomes.length ? session.desiredOutcomes : ["Spec reviewer confirms the intended outcome is testable"])}

## Open Questions
- None recorded

## Definition of Done
- Implementation plan is approved
- Review evidence is captured
- Verification evidence passes
`;
}

export function defaultTasks(session: WorkflowSession): WorkflowTask[] {
  return [
    {
      id: "T1",
      title: `Implement ${session.title}`,
      goal: session.problemStatement,
      files: [],
      acceptance_criteria: session.desiredOutcomes.length
        ? session.desiredOutcomes
        : ["The approved spec requirements are satisfied"],
      verification_steps: ["Run relevant tests", "Capture review and verification evidence"],
      dependencies: [],
      caution_notes: session.constraints
    }
  ];
}

export function planMarkdown(
  session: WorkflowSession,
  version: number,
  tasks: WorkflowTask[],
  notes: string
): string {
  return `# Plan v${version}: ${session.title}

## Planning assumptions
${notes || "Work is split into small tasks that can be reviewed and verified independently."}

## Task breakdown

${tasks
  .map(
    (task) => `### ${task.id}: ${task.title}
- Goal: ${task.goal}
- Files: ${task.files.length ? task.files.join(", ") : "To be identified during execution"}
- Acceptance criteria:
${list(task.acceptance_criteria)}
- Verification:
${list(task.verification_steps)}
- Dependencies: ${task.dependencies.length ? task.dependencies.join(", ") : "None"}
${task.caution_notes?.length ? `- Caution notes:\n${list(task.caution_notes)}` : ""}`
  )
  .join("\n\n")}
`;
}

export function list(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}
