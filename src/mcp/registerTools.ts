import { ZodObject, ZodRawShape } from "zod";
import { approvePlanTool } from "./tools/approvePlan.js";
import { approveSpecTool } from "./tools/approveSpec.js";
import { captureConstraintsTool } from "./tools/captureConstraints.js";
import { finishWorkflowTool } from "./tools/finishWorkflow.js";
import { generatePlanTool } from "./tools/generatePlan.js";
import { generateSpecTool } from "./tools/generateSpec.js";
import { getNextTaskTool } from "./tools/getNextTask.js";
import { reviewArtifactTool } from "./tools/reviewArtifact.js";
import { runTool } from "./tools/_helpers.js";
import { startWorkflowTool } from "./tools/startWorkflow.js";
import { verifyArtifactTool } from "./tools/verifyArtifact.js";

const tools = [
  startWorkflowTool,
  captureConstraintsTool,
  generateSpecTool,
  approveSpecTool,
  generatePlanTool,
  approvePlanTool,
  getNextTaskTool,
  reviewArtifactTool,
  verifyArtifactTool,
  finishWorkflowTool
];

export async function registerTools(server: any, deps: any) {
  for (const tool of tools) {
    const schema = tool.schema as ZodObject<ZodRawShape>;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: schema.shape
      },
      async (args: unknown) => runTool(tool.handler(deps.workflowService), args)
    );
  }
}
