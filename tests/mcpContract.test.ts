import { existsSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

let client: Client | null = null;

async function connectBuiltClient() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/src/index.js"],
    env: { ...process.env, WORKFLOW_DB_PATH: ":memory:" }
  });
  client = new Client({ name: "contract-test", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

afterEach(async () => {
  await client?.close();
  client = null;
});

describe("built MCP contract", () => {
  it("has a package start target that exists after build", () => {
    expect(existsSync("dist/src/index.js")).toBe(true);
  });

  it("lists the expected tools, resources, templates, and prompts", async () => {
    const mcp = await connectBuiltClient();
    const tools = await mcp.listTools();
    const resources = await mcp.listResources();
    const templates = await mcp.listResourceTemplates();
    const prompts = await mcp.listPrompts();

    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "start_workflow",
      "capture_constraints",
      "generate_spec",
      "approve_spec",
      "generate_plan",
      "approve_plan",
      "get_next_task",
      "review_artifact",
      "verify_artifact",
      "finish_workflow"
    ]);
    expect(resources.resources.map((resource) => resource.uri)).toEqual(expect.arrayContaining([
      "workflow://sessions",
      "workflow://playbooks/brainstorming",
      "workflow://playbooks/spec-template",
      "workflow://playbooks/plan-template",
      "workflow://playbooks/code-review",
      "workflow://playbooks/definition-of-done",
      "workflow://playbooks/tdd"
    ]));
    expect(templates.resourceTemplates.map((template) => template.uriTemplate)).toEqual([
      "workflow://sessions/{sessionId}/summary",
      "workflow://sessions/{sessionId}/brief",
      "workflow://sessions/{sessionId}/spec",
      "workflow://sessions/{sessionId}/plan",
      "workflow://sessions/{sessionId}/tasks",
      "workflow://sessions/{sessionId}/decision-log",
      "workflow://sessions/{sessionId}/review",
      "workflow://sessions/{sessionId}/verification"
    ]);
    expect(prompts.prompts.map((prompt) => prompt.name)).toEqual([
      "brainstorm_feature",
      "write_engineering_spec",
      "generate_task_plan",
      "request_code_review",
      "verify_done",
      "summarize_workflow_state"
    ]);
  });

  it("returns structured content and readable generated resources", async () => {
    const mcp = await connectBuiltClient();
    const started = await mcp.callTool({
      name: "start_workflow",
      arguments: {
        title: "Contract test",
        problem_statement: "Verify MCP resources",
        constraints: [],
        desired_outcomes: []
      }
    });
    const sessionId = (started.structuredContent as { session_id: string }).session_id;
    expect(sessionId).toMatch(/^wf_/);

    await mcp.callTool({ name: "generate_spec", arguments: { session_id: sessionId, spec_intent: "initial", notes: "" } });
    await mcp.callTool({ name: "approve_spec", arguments: { session_id: sessionId, version: 1, approval_note: "" } });
    await mcp.callTool({ name: "generate_plan", arguments: { session_id: sessionId, planning_mode: "task-breakdown", notes: "" } });
    await mcp.callTool({ name: "approve_plan", arguments: { session_id: sessionId, version: 1, approval_note: "" } });
    await mcp.callTool({ name: "get_next_task", arguments: { session_id: sessionId } });
    await mcp.callTool({
      name: "review_artifact",
      arguments: {
        session_id: sessionId,
        artifact_ref: "task:T1",
        summary: "Reviewed",
        evidence: [{ kind: "test-result", content: "passed" }]
      }
    });
    await mcp.callTool({ name: "verify_artifact", arguments: { session_id: sessionId, artifact_ref: "task:T1", verification_checks: ["passed"] } });

    const spec = await mcp.readResource({ uri: `workflow://sessions/${sessionId}/spec` });
    const plan = await mcp.readResource({ uri: `workflow://sessions/${sessionId}/plan` });
    const tasks = await mcp.readResource({ uri: `workflow://sessions/${sessionId}/tasks` });
    const review = await mcp.readResource({ uri: `workflow://sessions/${sessionId}/review` });
    const verification = await mcp.readResource({ uri: `workflow://sessions/${sessionId}/verification` });

    expect(spec.contents[0].mimeType).toBe("text/markdown");
    expect(plan.contents[0].mimeType).toBe("text/markdown");
    expect(tasks.contents[0].mimeType).toBe("application/json");
    expect((review.contents[0] as { text: string }).text).toContain("# Review v1");
    expect((verification.contents[0] as { text: string }).text).toContain("# Verification v1");
  });

  it("returns structured errors on invalid transitions", async () => {
    const mcp = await connectBuiltClient();
    const started = await mcp.callTool({
      name: "start_workflow",
      arguments: {
        title: "Error test",
        problem_statement: "Verify MCP error structure",
        constraints: [],
        desired_outcomes: []
      }
    });
    const sessionId = (started.structuredContent as { session_id: string }).session_id;

    const result = await mcp.callTool({ name: "generate_plan", arguments: { session_id: sessionId, planning_mode: "task-breakdown", notes: "" } });
    
    expect(result.isError).toBe(true);
    const errorPayload = result.structuredContent as any;
    expect(errorPayload.code).toBe("INVALID_TRANSITION");
    expect(errorPayload.current_state).toBe("DISCOVERY");
    expect(errorPayload.attempted_action).toBe("generate_plan");
  });
});
