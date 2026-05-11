import { toStructuredError } from "../../domain/errors.js";

export type ToolHandler = (input: unknown) => Promise<unknown>;

export function toolResponse(result: unknown) {
  return {
    structuredContent: result,
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }]
  };
}

export function toolErrorResponse(error: unknown) {
  const structuredError = toStructuredError(error);
  return {
    isError: true,
    structuredContent: structuredError,
    content: [{ type: "text" as const, text: JSON.stringify(structuredError, null, 2) }]
  };
}

export async function runTool(handler: ToolHandler, input: unknown) {
  try {
    return toolResponse(await handler(input));
  } catch (error) {
    return toolErrorResponse(error);
  }
}
