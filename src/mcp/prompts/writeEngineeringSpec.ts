import { z } from "zod";

export const writeEngineeringSpecPrompt = {
  name: "write_engineering_spec",
  title: "Write Engineering Spec",
  description: "Produce a structured spec draft for a workflow session.",
  schema: {
    session_id: z.string(),
    emphasis: z.string().optional(),
    notes: z.string().optional()
  },
  text: (args: Record<string, unknown>) => `Write an engineering spec draft for session ${args.session_id}.

Emphasis: ${args.emphasis ?? "balanced product and engineering quality"}
Notes: ${args.notes ?? "None"}

Include problem, goals, non-goals, assumptions, architecture, risks, rollout, acceptance criteria, open questions, and definition of done.`
};
