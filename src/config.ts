export interface AppConfig {
  transport: "stdio" | "http";
  port: number;
  host: string;
  databasePath: string;
}

export function loadConfig(env = process.env): AppConfig {
  const transport = env.MCP_TRANSPORT === "http" ? "http" : "stdio";
  return {
    transport,
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? "127.0.0.1",
    databasePath: env.WORKFLOW_DB_PATH ?? "workflow.db"
  };
}
