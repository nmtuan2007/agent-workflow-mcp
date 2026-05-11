# Agent Workflow MCP

Superpowers-inspired engineering workflow MCP server for coding agents and MCP-compatible IDEs.

The server is a workflow orchestration layer, not a code generator. It exposes MCP tools, resources, and prompts that guide an engineering task through spec approval, plan approval, execution guidance, review, verification, and completion.

## Why MCP

MCP gives IDEs and agent CLIs one standard integration surface for external tools, contextual resources, and reusable prompts. This server uses that surface to make workflow state and engineering artifacts available to any MCP-compatible client.

## Why Superpowers-Inspired

The workflow borrows the strongest guardrails from Superpowers-style development:

- no implementation plan before an approved spec
- no execution guidance before an approved plan
- no workflow completion before review and verification evidence
- versioned specs and plans

## Install

```sh
npm install
npm run build
```

## Development

```sh
npm run typecheck
npm test
npm run dev
```

By default the server uses stdio and writes SQLite data to `workflow.db`. Override the database path with `WORKFLOW_DB_PATH`.

## Local Stdio

```sh
WORKFLOW_DB_PATH=workflow.db npm run dev
```

Example MCP client config:

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

## Streamable HTTP

```sh
MCP_TRANSPORT=http HOST=127.0.0.1 PORT=3000 WORKFLOW_DB_PATH=workflow.db npm run dev
```

Endpoint:

```text
http://127.0.0.1:3000/mcp
```

## Sample Walkthrough

1. Call `start_workflow`.
2. Call `generate_spec`.
3. Call `approve_spec`.
4. Call `generate_plan`.
5. Call `approve_plan`.
6. Call `get_next_task`.
7. Call `review_artifact` with evidence.
8. Call `verify_artifact`.
9. Call `finish_workflow`.

Invalid transitions return structured tool errors with `current_state`, `attempted_action`, and `allowed_actions`.

## Resources

- `workflow://sessions`
- `workflow://sessions/{sessionId}/summary`
- `workflow://sessions/{sessionId}/brief`
- `workflow://sessions/{sessionId}/spec`
- `workflow://sessions/{sessionId}/plan`
- `workflow://sessions/{sessionId}/tasks`
- `workflow://sessions/{sessionId}/decision-log`
- `workflow://sessions/{sessionId}/review`
- `workflow://sessions/{sessionId}/verification`
- `workflow://playbooks/brainstorming`
- `workflow://playbooks/spec-template`
- `workflow://playbooks/plan-template`
- `workflow://playbooks/code-review`
- `workflow://playbooks/definition-of-done`
- `workflow://playbooks/tdd`

## Known Limitations

- No autonomous patching, git mutation, CI execution, issue tracker sync, dashboard, or auth provider integration.
- Generated spec and plan artifacts are deterministic templates intended for agent/user refinement.
- HTTP transport is minimal and local/session-safe, intended as an MVP integration path.
