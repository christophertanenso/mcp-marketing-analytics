import type { ToolResponse } from "../types/index.js";

export function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

export function notConfiguredResponse(apiName: string): ToolResponse {
  return {
    content: [{
      type: "text",
      text: `${apiName} is not configured. Please set the required environment variables in your .env file.\nRun "npm run setup" for an interactive guide.`,
    }],
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
