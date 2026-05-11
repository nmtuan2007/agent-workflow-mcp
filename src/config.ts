import { z } from "zod";

const ConfigSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("stdio"),
  port: z.coerce.number().int().positive().default(3000),
  host: z.string().default("127.0.0.1"),
  databasePath: z.string().default("workflow.db")
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(env = process.env): AppConfig {
  return ConfigSchema.parse({
    transport: env.MCP_TRANSPORT,
    port: env.PORT,
    host: env.HOST,
    databasePath: env.WORKFLOW_DB_PATH
  });
}
