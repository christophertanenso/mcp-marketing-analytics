import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GoogleAdsApi } from "google-ads-api";
import type { AppConfig } from "../../types/index.js";
import { handleToolError, notConfiguredResponse } from "../../utils/error-handler.js";
import { executeQuery } from "./query.js";
import { getCampaignPerformance } from "./campaign-performance.js";
import { getKeywordPerformance } from "./keyword-performance.js";
import { getAdGroupPerformance } from "./ad-group-performance.js";
import { getAccountSummary } from "./account-summary.js";

const DATE_RANGES = [
  "TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_30_DAYS",
  "THIS_MONTH", "LAST_MONTH", "LAST_90_DAYS",
] as const;

function getCustomer(config: AppConfig) {
  const client = new GoogleAdsApi({
    client_id: config.google!.clientId,
    client_secret: config.google!.clientSecret,
    developer_token: config.googleAds!.developerToken,
  });

  return client.Customer({
    customer_id: config.googleAds!.customerAccountId,
    refresh_token: config.google!.refreshToken,
    login_customer_id: config.googleAds!.loginCustomerId,
  });
}

export function registerGoogleAdsTools(server: McpServer, config: AppConfig): void {
  const isConfigured = !!(config.google && config.googleAds);

  server.tool(
    "gads_query",
    "Execute a raw Google Ads Query Language (GAQL) query. Use for custom queries not covered by other tools. Example: SELECT campaign.name, metrics.clicks FROM campaign WHERE segments.date DURING LAST_30_DAYS",
    {
      query: z.string().describe("A valid GAQL query string"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("googleAds", config);
      return handleToolError(async () => {
        const customer = getCustomer(config);
        const text = await executeQuery(customer, params.query);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gads_campaign_performance",
    "Get performance metrics for Google Ads campaigns: impressions, clicks, cost, conversions, CTR, CPC, and conversion rate.",
    {
      dateRange: z.enum(DATE_RANGES).default("LAST_30_DAYS").describe("Predefined date range"),
      status: z.enum(["all", "ENABLED", "PAUSED", "REMOVED"]).optional().default("all").describe("Filter by campaign status"),
      campaignType: z.enum(["all", "SEARCH", "DISPLAY", "SHOPPING", "VIDEO", "PERFORMANCE_MAX"]).optional().default("all").describe("Filter by campaign type"),
      limit: z.number().optional().default(25).describe("Max campaigns to return"),
      orderBy: z.enum(["cost", "clicks", "conversions", "impressions"]).optional().default("cost").describe("Sort by metric"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("googleAds", config);
      return handleToolError(async () => {
        const customer = getCustomer(config);
        const text = await getCampaignPerformance(customer, {
          dateRange: params.dateRange,
          status: params.status ?? "all",
          campaignType: params.campaignType ?? "all",
          limit: params.limit ?? 25,
          orderBy: params.orderBy ?? "cost",
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gads_keyword_performance",
    "Get performance metrics for Google Ads keywords: search term, match type, clicks, impressions, cost, conversions, and quality score.",
    {
      dateRange: z.enum(DATE_RANGES).default("LAST_30_DAYS").describe("Predefined date range"),
      campaignName: z.string().optional().describe("Filter to keywords in a specific campaign (exact name match)"),
      limit: z.number().optional().default(50).describe("Max keywords to return"),
      orderBy: z.enum(["cost", "clicks", "conversions", "impressions"]).optional().default("clicks").describe("Sort by metric"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("googleAds", config);
      return handleToolError(async () => {
        const customer = getCustomer(config);
        const text = await getKeywordPerformance(customer, {
          dateRange: params.dateRange,
          campaignName: params.campaignName,
          limit: params.limit ?? 50,
          orderBy: params.orderBy ?? "clicks",
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gads_ad_group_performance",
    "Get performance metrics for Google Ads ad groups: impressions, clicks, cost, conversions grouped by ad group within campaigns.",
    {
      dateRange: z.enum(DATE_RANGES).default("LAST_30_DAYS").describe("Predefined date range"),
      campaignName: z.string().optional().describe("Filter to ad groups in a specific campaign"),
      limit: z.number().optional().default(25).describe("Max ad groups to return"),
      orderBy: z.enum(["cost", "clicks", "conversions", "impressions"]).optional().default("cost").describe("Sort by metric"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("googleAds", config);
      return handleToolError(async () => {
        const customer = getCustomer(config);
        const text = await getAdGroupPerformance(customer, {
          dateRange: params.dateRange,
          campaignName: params.campaignName,
          limit: params.limit ?? 25,
          orderBy: params.orderBy ?? "cost",
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gads_account_summary",
    "Get a high-level summary of the Google Ads account: total spend, clicks, impressions, conversions, and key averages, plus top 5 campaigns by spend.",
    {
      dateRange: z.enum(DATE_RANGES).default("LAST_30_DAYS").describe("Predefined date range"),
    },
    async (params) => {
      if (!isConfigured) return notConfiguredResponse("googleAds", config);
      return handleToolError(async () => {
        const customer = getCustomer(config);
        const text = await getAccountSummary(customer, params.dateRange);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );
}
