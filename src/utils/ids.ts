import { nanoid } from "nanoid";

export function workflowId(): string {
  return `wf_${nanoid(12)}`;
}

export function recordId(prefix: string): string {
  return `${prefix}_${nanoid(12)}`;
}
