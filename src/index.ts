import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { registerGA4Tools } from "./tools/ga4/index.js";
import { registerGSCTools } from "./tools/gsc/index.js";
import { registerMetaTools } from "./tools/meta/index.js";
import { registerGoogleAdsTools } from "./tools/google-ads/index.js";
import { fullSetupGuide } from "./utils/setup-guides.js";

async function main() {
  const config = loadConfig();

  const server = new McpServer({
    name: "marketing-analytics",
    version: "1.0.0",
  });

  // Always-available setup guide tool
  server.tool(
    "setup_guide",
    "Get step-by-step instructions for configuring the Marketing Analytics MCP server. Shows which APIs are configured and provides detailed setup guides for any that are missing.",
    {},
    async () => {
      const text = fullSetupGuide(config);
      return { content: [{ type: "text" as const, text }] };
    },
  );

  registerGA4Tools(server, config);
  registerGSCTools(server, config);
  registerMetaTools(server, config);
  registerGoogleAdsTools(server, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Marketing Analytics MCP server running on stdio");
  console.error("Tools registered for: GA4, GSC, Meta Ads, Google Ads");
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
