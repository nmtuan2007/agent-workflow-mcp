export const playbooks: Record<string, string> = {
  brainstorming: "# Brainstorming Playbook\n\nClarify the problem, constraints, desired outcomes, non-goals, and unknowns before drafting a spec.\n",
  "spec-template": "# Spec Template\n\nUse sections for problem, goals, non-goals, assumptions, architecture, risks, rollout, acceptance criteria, open questions, and definition of done.\n",
  "plan-template": "# Plan Template\n\nBreak work into small tasks with files, acceptance criteria, verification steps, dependencies, and caution notes.\n",
  "code-review": "# Code Review Playbook\n\nCheck conformance to approved plan, test coverage, regressions, maintainability, and evidence quality.\n",
  "definition-of-done": "# Definition of Done\n\nA workflow is done only after review evidence exists, verification passes, and finish_workflow succeeds.\n",
  tdd: "# TDD Playbook\n\nState expected behavior, add or update tests first where practical, implement narrowly, then run and record verification evidence.\n"
};
