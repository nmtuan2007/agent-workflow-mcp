import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toStructuredError } from "../domain/errors.js";
import { briefResource } from "./resources/briefResource.js";
import { decisionLogResource } from "./resources/decisionLogResource.js";
import { planResource } from "./resources/planResource.js";
import { playbooks } from "./resources/playbooksResource.js";
import { reviewResource } from "./resources/reviewResource.js";
import { sessionSummaryResource } from "./resources/sessionSummary.js";
import { sessionsResource } from "./resources/sessions.js";
import { specResource } from "./resources/specResource.js";
import { tasksResource } from "./resources/tasksResource.js";
import { verificationResource } from "./resources/verificationResource.js";

type ResourceReader = (service: any, sessionId: string) => Promise<string>;

const sessionResources: Array<{ name: string; suffix: string; mimeType: string; reader: ResourceReader }> = [
  { name: "session-summary", suffix: "summary", mimeType: "text/markdown", reader: sessionSummaryResource },
  { name: "brief", suffix: "brief", mimeType: "text/markdown", reader: briefResource },
  { name: "spec", suffix: "spec", mimeType: "text/markdown", reader: specResource },
  { name: "plan", suffix: "plan", mimeType: "text/markdown", reader: planResource },
  { name: "tasks", suffix: "tasks", mimeType: "application/json", reader: tasksResource },
  { name: "decision-log", suffix: "decision-log", mimeType: "text/markdown", reader: decisionLogResource },
  { name: "review", suffix: "review", mimeType: "text/markdown", reader: reviewResource },
  { name: "verification", suffix: "verification", mimeType: "text/markdown", reader: verificationResource }
];

export async function registerResources(server: any, deps: any) {
  server.registerResource(
    "sessions",
    "workflow://sessions",
    {
      title: "Workflow Sessions",
      description: "List workflow sessions.",
      mimeType: "application/json"
    },
    async (uri: URL) => resourceResult(uri.href, "application/json", await sessionsResource(deps.workflowService))
  );

  for (const resource of sessionResources) {
    server.registerResource(
      resource.name,
      new ResourceTemplate(`workflow://sessions/{sessionId}/${resource.suffix}`, { list: undefined }),
      {
        title: resource.name,
        description: `Latest ${resource.suffix} resource for a workflow session.`,
        mimeType: resource.mimeType
      },
      async (uri: URL, params: { sessionId: string }) =>
        guardedResource(uri.href, resource.mimeType, () => resource.reader(deps.workflowService, String(params.sessionId)))
    );
  }

  for (const [key, text] of Object.entries(playbooks)) {
    server.registerResource(
      `playbook-${key}`,
      `workflow://playbooks/${key}`,
      {
        title: `Playbook: ${key}`,
        description: `Static workflow playbook: ${key}.`,
        mimeType: "text/markdown"
      },
      async (uri: URL) => resourceResult(uri.href, "text/markdown", text)
    );
  }
}

async function guardedResource(uri: string, mimeType: string, read: () => Promise<string>) {
  try {
    return resourceResult(uri, mimeType, await read());
  } catch (error) {
    return resourceResult(uri, "application/json", JSON.stringify(toStructuredError(error), null, 2));
  }
}

function resourceResult(uri: string, mimeType: string, text: string) {
  return {
    contents: [{ uri, mimeType, text }]
  };
}
