import type { ToolResponse } from "../types/index.js";
import type { AppConfig } from "../types/index.js";
import { type ApiFamily, setupInstructionsFor } from "./setup-guides.js";

export function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

export function notConfiguredResponse(apiFamily: ApiFamily, config: AppConfig): ToolResponse {
  const text = setupInstructionsFor(apiFamily, config);
  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}

export function textResponse(text: string): ToolResponse {
  return {
    content: [{ type: "text", text }],
  };
}

export async function handleToolError(fn: () => Promise<ToolResponse>): Promise<ToolResponse> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[tool-error] ${message}`);
    return errorResponse(message);
  }
}
