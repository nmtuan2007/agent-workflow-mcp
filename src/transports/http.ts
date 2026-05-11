import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export async function runHttp(server: McpServer, options: { host: string; port: number }): Promise<void> {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true
  });
  await server.connect(transport);

  app.post("/mcp", async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    await transport.handleRequest(req, res);
  });

  app.listen(options.port, options.host, () => {
    console.error(`agent-workflow-mcp listening on http://${options.host}:${options.port}/mcp`);
  });
}
