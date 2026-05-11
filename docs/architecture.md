# Architecture

The server has four layers:

- Domain: TypeScript types, Zod schemas, and structured workflow errors.
- Workflow: state machine, policy guards, and `WorkflowService`.
- Storage: SQLite adapter plus workflow and artifact repositories.
- MCP: thin tool, resource, prompt, and transport adapters.

Business rules live in `src/workflow/policy.ts` and `src/workflow/service.ts`. MCP handlers delegate to the service and return structured JSON.

SQLite tables:

- `workflow_sessions`
- `artifacts`
- `evidence`
- `approvals`

Specs and plans are versioned artifacts. Approved versions are tracked on the session and in `approvals`.
