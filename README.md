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

## Quickstart

You can run `agent-workflow-mcp` using either `stdio` (for local MCP client integrations) or `http` (for remote integrations).

First, build the project:
```sh
npm install
npm run build
```

Then, configure your environment using a `.env` file (see `.env.example`).

### Local Stdio

For local execution, the server defaults to `stdio` transport. Run the server using:

```sh
npm start
```

Example MCP client config (e.g., for Claude Desktop):
```json
{
  "mcpServers": {
    "agent-workflow": {
      "command": "node",
      "args": ["dist/src/index.js"],
      "env": {
        "WORKFLOW_DB_PATH": "workflow.db"
      }
    }
  }
}
```

### Streamable HTTP

For remote setups or development tools that support Streamable HTTP, run the server with the `http` transport:

```sh
MCP_TRANSPORT=http PORT=3000 npm run dev
```

Endpoint:
```text
http://127.0.0.1:3000/mcp
```

## Sample Walkthrough Session

Here is an example of the progression of an engineering task using the provided MCP tools:

1. **Start the workflow**
   - Tool: `start_workflow`
   - Purpose: Define the problem statement and create a new session.
   
2. **Design the solution**
   - Tool: `generate_spec`
   - Purpose: Drafts an engineering specification outlining the architecture and implementation details.
   - *Requires User Approval*: Use the `approve_spec` tool after review.

3. **Plan the execution**
   - Tool: `generate_plan`
   - Purpose: Breaks the approved specification down into actionable tasks.
   - *Requires User Approval*: Use the `approve_plan` tool after review.

4. **Execute and Review**
   - Tool: `get_next_task` (Retrieves the next pending task)
   - *Write Code...*
   - Tool: `review_artifact` (Submit evidence of the completed task, e.g., test results)
   - Tool: `verify_artifact` (Verify that the review meets the definition of done)

5. **Completion**
   - Tool: `finish_workflow`
   - Purpose: Marks the workflow as finished once all artifacts are verified.

Invalid transitions (e.g., trying to generate a plan before a spec is approved) will return structured tool errors containing the `current_state`, the `attempted_action`, and the `allowed_actions`.

## Release Notes

### v0.1.0 - Public Beta
- **Config Validation**: Strict parsing of configuration variables via Zod.
- **Improved Observability**: Added startup diagnostic logs and robust error structures.
- **Negative Tests**: Extended the testing suite to cover edge cases and invalid transitions.
- **Transport**: Standardized `stdio` (default) and `http` integrations for IDE and Agent interoperability.

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
