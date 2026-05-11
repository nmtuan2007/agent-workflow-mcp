#!/usr/bin/env node
import { loadConfig } from "./config.js";
import { createDeps, createMcpServer } from "./mcp/server.js";
import { createDatabase } from "./storage/sqlite.js";
import { runHttp } from "./transports/http.js";
import { runStdio } from "./transports/stdio.js";

async function main() {
  const config = loadConfig();
  const db = await createDatabase(config.databasePath);
  await db.init();
  const deps = createDeps(db);
  const server = await createMcpServer(deps);

  if (config.transport === "http") {
    await runHttp(server, { host: config.host, port: config.port });
    return;
  }

  await runStdio(server);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
