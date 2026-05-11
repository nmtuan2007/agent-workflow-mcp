import { brainstormFeaturePrompt } from "./prompts/brainstormFeature.js";
import { generateTaskPlanPrompt } from "./prompts/generateTaskPlan.js";
import { requestCodeReviewPrompt } from "./prompts/requestCodeReview.js";
import { summarizeWorkflowStatePrompt } from "./prompts/summarizeWorkflowState.js";
import { verifyDonePrompt } from "./prompts/verifyDone.js";
import { writeEngineeringSpecPrompt } from "./prompts/writeEngineeringSpec.js";

const prompts = [
  brainstormFeaturePrompt,
  writeEngineeringSpecPrompt,
  generateTaskPlanPrompt,
  requestCodeReviewPrompt,
  verifyDonePrompt,
  summarizeWorkflowStatePrompt
];

export async function registerPrompts(server: any, _deps: any) {
  for (const prompt of prompts) {
    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
        argsSchema: prompt.schema
      },
      async (args: Record<string, unknown>) => ({
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: prompt.text(args) }
          }
        ]
      })
    );
  }
}
