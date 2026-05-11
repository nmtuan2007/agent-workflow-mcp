# Local Stdio Example

Build the server:

```sh
npm install
npm run build
```

Run through stdio:

```sh
WORKFLOW_DB_PATH=workflow.db node dist/index.js
```

MCP client config:

```json
{
  "mcpServers": {
    "agent-workflow": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "WORKFLOW_DB_PATH": "workflow.db"
      }
    }
  }
}
```
