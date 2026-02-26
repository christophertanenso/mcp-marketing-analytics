import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppConfig } from "../../types/index.js";
import { initMetaApi } from "../../auth/meta-auth.js";
import { handleToolError, notConfiguredResponse } from "../../utils/error-handler.js";
import { listAdAccounts } from "./list-accounts.js";
import { getAccountOverview } from "./account-overview.js";
import { getCampaignInsights } from "./campaign-insights.js";
import { getAdsetInsights } from "./adset-insights.js";
import { getAdInsights } from "./ad-insights.js";

export function registerMetaTools(server: McpServer, config: AppConfig): void {
  const isConfigured = !!config.meta;

  if (isConfigured) {
    initMetaApi(config.meta!);
  }

  server.tool(
    "meta_list_ad_accounts",
    "List all Meta/Facebook ad accounts accessible with the current access token. Returns account ID, name, status, currency, and timezone.",
    {
      limit: z.number().optional().default(25).describe("Max accounts to return"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("meta", config);
      return handleToolError(async () => {
        const text = await listAdAccounts(params.limit ?? 25);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "meta_account_overview",
    "Get a high-level performance overview for a Meta ad account: total spend, impressions, clicks, CTR, CPC, CPM, and conversions for the specified date range. Optionally break down by age, gender, country, placement, or device.",
    {
      accountId: z.string().describe("Ad account ID, e.g. 'act_123456789'"),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      breakdown: z.enum(["none", "age", "gender", "country", "placement", "device_platform"]).optional().default("none").describe("Optional breakdown dimension"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("meta", config);
      return handleToolError(async () => {
        const text = await getAccountOverview(
          params.accountId,
          params.startDate,
          params.endDate,
          params.breakdown ?? "none",
        );
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "meta_campaign_insights",
    "Get performance insights for all campaigns in a Meta ad account. Shows each campaign's spend, impressions, clicks, CTR, CPC, and conversions.",
    {
      accountId: z.string().describe("Ad account ID, e.g. 'act_123456789'"),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      status: z.enum(["all", "ACTIVE", "PAUSED", "ARCHIVED"]).optional().default("all").describe("Filter by campaign status"),
      limit: z.number().optional().default(25).describe("Max campaigns to return"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("meta", config);
      return handleToolError(async () => {
        const text = await getCampaignInsights(
          params.accountId,
          params.startDate,
          params.endDate,
          params.status ?? "all",
          params.limit ?? 25,
        );
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "meta_adset_insights",
    "Get performance insights for ad sets within a campaign or account. Shows spend, impressions, clicks, and conversions per ad set.",
    {
      accountId: z.string().describe("Ad account ID, e.g. 'act_123456789'"),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      campaignId: z.string().optional().describe("Filter to a specific campaign ID"),
      limit: z.number().optional().default(25).describe("Max ad sets to return"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("meta", config);
      return handleToolError(async () => {
        const text = await getAdsetInsights(
          params.accountId,
          params.startDate,
          params.endDate,
          params.campaignId,
          params.limit ?? 25,
        );
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "meta_ad_insights",
    "Get performance insights for individual ads. Shows each ad's name, ad set, campaign, spend, impressions, clicks, and conversions.",
    {
      accountId: z.string().describe("Ad account ID, e.g. 'act_123456789'"),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      campaignId: z.string().optional().describe("Filter to a specific campaign ID"),
      adsetId: z.string().optional().describe("Filter to a specific ad set ID"),
      limit: z.number().optional().default(25).describe("Max ads to return"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("meta", config);
      return handleToolError(async () => {
        const text = await getAdInsights(
          params.accountId,
          params.startDate,
          params.endDate,
          params.campaignId,
          params.adsetId,
          params.limit ?? 25,
        );
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );
}
