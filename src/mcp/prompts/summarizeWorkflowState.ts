import { z } from "zod";

export const summarizeWorkflowStatePrompt = {
  name: "summarize_workflow_state",
  title: "Summarize Workflow State",
  description: "Summarize current state, latest artifacts, blockers, and next action.",
  schema: {
    session_id: z.string()
  },
  text: (args: Record<string, unknown>) => `Summarize workflow session ${args.session_id}.

Include current state, latest spec and plan versions, blockers, recent evidence, and the next recommended action.`
};
