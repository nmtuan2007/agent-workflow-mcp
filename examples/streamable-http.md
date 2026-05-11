# Streamable HTTP Example

Build the server:

```sh
npm install
npm run build
```

Run with Streamable HTTP:

```sh
MCP_TRANSPORT=http HOST=127.0.0.1 PORT=3000 WORKFLOW_DB_PATH=workflow.db node dist/index.js
```

MCP endpoint:

```text
http://127.0.0.1:3000/mcp
```
