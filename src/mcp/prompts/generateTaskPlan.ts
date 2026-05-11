import { z } from "zod";

export const generateTaskPlanPrompt = {
  name: "generate_task_plan",
  title: "Generate Task Plan",
  description: "Break an approved spec into small executable tasks.",
  schema: {
    session_id: z.string(),
    planning_style: z.string().optional(),
    notes: z.string().optional()
  },
  text: (args: Record<string, unknown>) => `Generate a task plan for session ${args.session_id}.

Planning style: ${args.planning_style ?? "small tasks with explicit verification"}
Notes: ${args.notes ?? "None"}

Each task must include id, title, goal, files, acceptance criteria, verification steps, dependencies, and caution notes.`
};
