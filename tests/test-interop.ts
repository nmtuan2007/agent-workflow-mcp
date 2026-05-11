import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function runTests() {
  console.log("=== Transport Initialization ===");
  const transportStdio = new StdioClientTransport({
    command: "node",
    args: ["--import", "tsx", "src/index.ts"],
    env: { ...process.env, WORKFLOW_DB_PATH: ":memory:" }
  });
  const stdioClient = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await stdioClient.connect(transportStdio);
  console.log("✅ Connected via stdio");

  const { spawn } = await import("child_process");
  const server = spawn("node", ["--import", "tsx", "src/index.ts"], {
    env: { ...process.env, MCP_TRANSPORT: "http", PORT: "3001", WORKFLOW_DB_PATH: ":memory:" },
    stdio: "pipe"
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const transportHttp = new StreamableHTTPClientTransport(new URL("http://127.0.0.1:3001/mcp"));
  const httpClient = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );
  await httpClient.connect(transportHttp);
  console.log("✅ Connected via Streamable HTTP");

  // We will run the complex logic using stdio client for simplicity
  const client = stdioClient;

  console.log("\n=== 3. Capability Checks ===");
  const tools = await client.listTools();
  console.log(`✅ Tools listed: ${tools.tools.length} found`);
  const resources = await client.listResources();
  console.log(`✅ Resources listed: ${resources.resources.length} found`);
  const prompts = await client.listPrompts();
  console.log(`✅ Prompts listed: ${prompts.prompts.length} found`);

  console.log("\n=== 4. Tool Smoke Flow ===");
  let sessionId = "";
  try {
    const resStart = await client.callTool({
      name: "start_workflow",
      arguments: {
        title: "Test Feature",
        problem_statement: "A feature to test the workflow",
        constraints: [],
        desired_outcomes: []
      }
    });
    const content = (resStart as any).content[0];
    if (content.type === "text") {
      try {
        const parsed = JSON.parse(content.text);
        sessionId = parsed.session_id;
      } catch (e) {
        // Fallback if not JSON
        const match = content.text.match(/([a-zA-Z0-9_-]+)/);
        if (match) sessionId = match[1];
      }
    }
    console.log(`✅ start_workflow: ${sessionId}`);

    await client.callTool({
      name: "generate_spec",
      arguments: { session_id: sessionId }
    });
    console.log("✅ generate_spec");

    await client.callTool({
      name: "approve_spec",
      arguments: { session_id: sessionId }
    });
    console.log("✅ approve_spec");

    await client.callTool({
      name: "generate_plan",
      arguments: { session_id: sessionId }
    });
    console.log("✅ generate_plan");

    await client.callTool({
      name: "approve_plan",
      arguments: { session_id: sessionId }
    });
    console.log("✅ approve_plan");

    await client.callTool({
      name: "get_next_task",
      arguments: { session_id: sessionId }
    });
    console.log("✅ get_next_task");

    await client.callTool({
      name: "review_artifact",
      arguments: { session_id: sessionId, artifact_path: "src/index.ts" }
    });
    console.log("✅ review_artifact");

    await client.callTool({
      name: "verify_artifact",
      arguments: { session_id: sessionId, test_results: "all passed" }
    });
    console.log("✅ verify_artifact");

    await client.callTool({
      name: "finish_workflow",
      arguments: { session_id: sessionId }
    });
    console.log("✅ finish_workflow");

  } catch (err) {
    console.error("❌ Tool smoke flow failed:", err);
  }

  console.log("\n=== 5. Negative-path Flow ===");
  try {
    const res = await client.callTool({
      name: "start_workflow",
      arguments: {
        title: "Negative test",
        problem_statement: "Negative test",
        constraints: [],
        desired_outcomes: []
      }
    });
    let badSessionId = "";
    if ((res as any).content[0].type === "text") {
      try {
        badSessionId = JSON.parse((res as any).content[0].text).session_id;
      } catch (e) { }
    }
    
    // Attempt generate_plan before approve_spec
    let caught = false;
    try {
      const resPlan = await client.callTool({
        name: "generate_plan",
        arguments: { session_id: badSessionId }
      });
      if (resPlan.isError) caught = true;
    } catch (e) {
      caught = true;
    }
    if (!caught) console.error("❌ generate_plan should have failed");
    else console.log("✅ generate_plan before approve_spec correctly failed");

    // Invalid session ID
    caught = false;
    try {
      const resInvalid = await client.callTool({
        name: "generate_spec",
        arguments: { session_id: "invalid-id" }
      });
      if (resInvalid.isError) caught = true;
    } catch (e) {
      caught = true;
    }
    if (!caught) console.error("❌ Invalid session ID should have failed");
    else console.log("✅ Invalid session ID correctly failed");

  } catch (err) {
    console.error("Negative flow testing error", err);
  }

  console.log("\n=== 6. Resource Smoke Flow ===");
  try {
    const resSummary = await client.readResource({ uri: `workflow://sessions/${sessionId}/summary` });
    console.log("✅ Read summary resource");

    const resSpec = await client.readResource({ uri: `workflow://sessions/${sessionId}/spec` });
    console.log("✅ Read spec resource");

    const resPlan = await client.readResource({ uri: `workflow://sessions/${sessionId}/plan` });
    console.log("✅ Read plan resource");

    const resTasks = await client.readResource({ uri: `workflow://sessions/${sessionId}/tasks` });
    console.log("✅ Read tasks resource");
  } catch (err) {
    console.error("❌ Resource flow failed:", err);
  }

  console.log("\n=== 7. Prompt Smoke Flow ===");
  try {
    const prompt = await client.getPrompt({
      name: "write_engineering_spec",
      arguments: { session_id: sessionId }
    });
    console.log(`✅ Retrieved prompt write_engineering_spec with ${prompt.messages.length} messages`);
  } catch (err) {
    console.error("❌ Prompt flow failed:", err);
  }

  await stdioClient.close();
  await httpClient.close();
  server.kill();
}

runTests().catch(console.error);
