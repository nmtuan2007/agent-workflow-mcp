import { z } from "zod";

export const brainstormFeaturePrompt = {
  name: "brainstorm_feature",
  title: "Brainstorm Feature",
  description: "Turn a vague idea into a concrete engineering brief.",
  schema: {
    title: z.string(),
    problem_statement: z.string(),
    constraints: z.string().optional(),
    desired_outcomes: z.string().optional()
  },
  text: (args: Record<string, unknown>) => `Brainstorm an engineering brief.

Title: ${args.title}
Problem: ${args.problem_statement}
Constraints: ${args.constraints ?? "None supplied"}
Desired outcomes: ${args.desired_outcomes ?? "None supplied"}

Clarify goals, non-goals, risks, assumptions, and open questions before implementation planning.`
};
