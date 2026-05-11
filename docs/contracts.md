# Tool Contracts

Tools:

- `start_workflow`
- `capture_constraints`
- `generate_spec`
- `approve_spec`
- `generate_plan`
- `approve_plan`
- `get_next_task`
- `review_artifact`
- `verify_artifact`
- `finish_workflow`

Every successful mutable tool response includes `next_recommended_action` except `finish_workflow`, which returns the final summary URI.

Invalid transitions return:

```json
{
  "code": "INVALID_TRANSITION",
  "message": "Cannot run action from state.",
  "current_state": "DISCOVERY",
  "attempted_action": "generate_plan",
  "allowed_actions": ["capture_constraints", "generate_spec"]
}
```
