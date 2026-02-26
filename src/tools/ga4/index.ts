import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppConfig } from "../../types/index.js";
import { getAnalyticsDataClient, getGoogleOAuth2Client } from "../../auth/google-auth.js";
import { handleToolError, notConfiguredResponse, errorResponse } from "../../utils/error-handler.js";
import { runReport } from "./run-report.js";
import { runRealtimeReport } from "./realtime-report.js";
import { getTopPages } from "./top-pages.js";
import { getTrafficSources } from "./traffic-sources.js";
import { getUserMetrics } from "./user-metrics.js";
import { listGA4Accounts } from "./list-accounts.js";

export function registerGA4Tools(server: McpServer, config: AppConfig): void {
  const hasGoogleAuth = !!config.google;
  const defaultPropertyId = config.ga4?.propertyId;

  function resolvePropertyId(param?: string): string | null {
    return param || defaultPropertyId || null;
  }

  server.tool(
    "ga4_list_accounts",
    "List all GA4 properties accessible to the authenticated Google account. Use this to discover Property IDs for use with other ga4_* tools.",
    {},
    async () => {
      if (!hasGoogleAuth) return notConfiguredResponse("Google OAuth2");
      return handleToolError(async () => {
        const auth = getGoogleOAuth2Client(config.google!);
        const text = await listGA4Accounts(auth);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "ga4_run_report",
    "Run a custom GA4 report with specified dimensions, metrics, and date range. Use GA4 API names like 'activeUsers', 'sessions', 'pagePath', 'sessionSource'. Dates: YYYY-MM-DD or relative like '7daysAgo', '30daysAgo', 'today', 'yesterday'.",
    {
      propertyId: z.string().optional().describe("GA4 Property ID (e.g. '123456789'). Use ga4_list_accounts to find available properties. If omitted, uses the default from env."),
      dimensions: z.array(z.string()).describe("GA4 dimension names, e.g. ['pagePath', 'sessionSource']"),
      metrics: z.array(z.string()).describe("GA4 metric names, e.g. ['activeUsers', 'sessions', 'screenPageViews']"),
      startDate: z.string().default("28daysAgo").describe("Start date (YYYY-MM-DD or relative)"),
      endDate: z.string().default("today").describe("End date (YYYY-MM-DD or relative)"),
      limit: z.number().optional().default(10).describe("Max rows to return (default 10)"),
      filterField: z.string().optional().describe("Dimension name to filter on"),
      filterMatch: z.enum(["EXACT", "BEGINS_WITH", "ENDS_WITH", "CONTAINS", "FULL_REGEXP"]).optional().describe("Filter match type"),
      filterValue: z.string().optional().describe("Filter value"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("Google OAuth2");
      const propId = resolvePropertyId(params.propertyId);
      if (!propId) return errorResponse("No Property ID provided. Use ga4_list_accounts to find your Property ID, then pass it as propertyId.");
      return handleToolError(async () => {
        const client = getAnalyticsDataClient(config.google!);
        const text = await runReport(client, propId, {
          dimensions: params.dimensions,
          metrics: params.metrics,
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit ?? 10,
          dimensionFilter: params.filterField && params.filterMatch && params.filterValue
            ? { fieldName: params.filterField, matchType: params.filterMatch, value: params.filterValue }
            : undefined,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "ga4_realtime_report",
    "Get a realtime GA4 report showing current active users and activity from the last 30 minutes.",
    {
      propertyId: z.string().optional().describe("GA4 Property ID. Use ga4_list_accounts to find available properties."),
      dimensions: z.array(z.string()).optional().default(["unifiedScreenName"]).describe("Realtime dimensions, e.g. 'unifiedScreenName', 'country', 'city', 'deviceCategory'"),
      metrics: z.array(z.string()).optional().default(["activeUsers"]).describe("Realtime metrics, e.g. 'activeUsers', 'screenPageViews', 'conversions'"),
      limit: z.number().optional().default(10).describe("Max rows to return"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("Google OAuth2");
      const propId = resolvePropertyId(params.propertyId);
      if (!propId) return errorResponse("No Property ID provided. Use ga4_list_accounts to find your Property ID.");
      return handleToolError(async () => {
        const client = getAnalyticsDataClient(config.google!);
        const text = await runRealtimeReport(client, propId, {
          dimensions: params.dimensions ?? ["unifiedScreenName"],
          metrics: params.metrics ?? ["activeUsers"],
          limit: params.limit ?? 10,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "ga4_top_pages",
    "Get the top pages by views for the specified date range. Returns page path, title, views, users, and average session duration.",
    {
      propertyId: z.string().optional().describe("GA4 Property ID. Use ga4_list_accounts to find available properties."),
      startDate: z.string().default("28daysAgo").describe("Start date"),
      endDate: z.string().default("today").describe("End date"),
      limit: z.number().optional().default(20).describe("Max rows to return"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("Google OAuth2");
      const propId = resolvePropertyId(params.propertyId);
      if (!propId) return errorResponse("No Property ID provided. Use ga4_list_accounts to find your Property ID.");
      return handleToolError(async () => {
        const client = getAnalyticsDataClient(config.google!);
        const text = await getTopPages(client, propId, {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit ?? 20,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "ga4_traffic_sources",
    "Get traffic source breakdown showing sessions, users, and engagement by source/medium for the specified date range.",
    {
      propertyId: z.string().optional().describe("GA4 Property ID. Use ga4_list_accounts to find available properties."),
      startDate: z.string().default("28daysAgo").describe("Start date"),
      endDate: z.string().default("today").describe("End date"),
      limit: z.number().optional().default(20).describe("Max rows to return"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("Google OAuth2");
      const propId = resolvePropertyId(params.propertyId);
      if (!propId) return errorResponse("No Property ID provided. Use ga4_list_accounts to find your Property ID.");
      return handleToolError(async () => {
        const client = getAnalyticsDataClient(config.google!);
        const text = await getTrafficSources(client, propId, {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit ?? 20,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "ga4_user_metrics",
    "Get a summary of key user metrics: total users, new users, sessions, page views, bounce rate, avg session duration, and engagement rate. Optionally compare with the previous period.",
    {
      propertyId: z.string().optional().describe("GA4 Property ID. Use ga4_list_accounts to find available properties."),
      startDate: z.string().default("28daysAgo").describe("Start date"),
      endDate: z.string().default("today").describe("End date"),
      comparePreviousPeriod: z.boolean().optional().default(false).describe("If true, also fetches the previous period of the same length for comparison"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("Google OAuth2");
      const propId = resolvePropertyId(params.propertyId);
      if (!propId) return errorResponse("No Property ID provided. Use ga4_list_accounts to find your Property ID.");
      return handleToolError(async () => {
        const client = getAnalyticsDataClient(config.google!);
        const text = await getUserMetrics(client, propId, {
          startDate: params.startDate,
          endDate: params.endDate,
          comparePreviousPeriod: params.comparePreviousPeriod ?? false,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );
}
