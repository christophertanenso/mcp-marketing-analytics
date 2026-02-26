import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppConfig } from "../../types/index.js";
import { getSearchConsoleClient, getWebmastersClient } from "../../auth/google-auth.js";
import { handleToolError, notConfiguredResponse, errorResponse } from "../../utils/error-handler.js";
import { searchAnalytics } from "./search-analytics.js";
import { getTopQueries } from "./top-queries.js";
import { getTopPages } from "./top-pages.js";
import { inspectUrl } from "./inspect-url.js";
import { listSitemaps } from "./list-sitemaps.js";
import { listSites } from "./list-sites.js";

export function registerGSCTools(server: McpServer, config: AppConfig): void {
  const hasGoogleAuth = !!config.google;
  const defaultSiteUrl = config.gsc?.siteUrl;

  function resolveSiteUrl(param?: string): string | null {
    return param || defaultSiteUrl || null;
  }

  server.tool(
    "gsc_list_sites",
    "List all Search Console sites/properties accessible to the authenticated Google account. Use this to discover Site URLs for use with other gsc_* tools.",
    {},
    async () => {
      if (!hasGoogleAuth) return notConfiguredResponse("google", config);
      return handleToolError(async () => {
        const client = getWebmastersClient(config.google!);
        const text = await listSites(client);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gsc_search_analytics",
    "Query Google Search Console search analytics data with flexible dimensions and filters. Returns clicks, impressions, CTR, and average position.",
    {
      siteUrl: z.string().optional().describe("Site URL (e.g. 'https://example.com' or 'sc-domain:example.com'). Use gsc_list_sites to find available sites. If omitted, uses the default from env."),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      dimensions: z.array(z.enum(["query", "page", "country", "device", "date", "searchAppearance"])).optional().default(["query"]).describe("Dimensions to group by"),
      rowLimit: z.number().optional().default(25).describe("Max rows (1-25000)"),
      searchType: z.enum(["web", "image", "video", "news", "discover", "googleNews"]).optional().default("web").describe("Search type to filter"),
      filterDimension: z.string().optional().describe("Dimension to filter on (query, page, country, device)"),
      filterOperator: z.enum(["equals", "contains", "notContains", "includingRegex", "excludingRegex"]).optional().describe("Filter operator"),
      filterExpression: z.string().optional().describe("Filter expression/value"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("google", config);
      const site = resolveSiteUrl(params.siteUrl);
      if (!site) return errorResponse("No Site URL provided. Use gsc_list_sites to find your site, then pass it as siteUrl.");
      return handleToolError(async () => {
        const client = getWebmastersClient(config.google!);
        const filters = params.filterDimension && params.filterOperator && params.filterExpression
          ? [{ dimension: params.filterDimension, operator: params.filterOperator, expression: params.filterExpression }]
          : undefined;
        const text = await searchAnalytics(client, site, {
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: params.dimensions ?? ["query"],
          rowLimit: params.rowLimit ?? 25,
          searchType: params.searchType ?? "web",
          filters,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gsc_top_queries",
    "Get the top search queries driving traffic to your site, sorted by clicks. Shows query, clicks, impressions, CTR, and average position.",
    {
      siteUrl: z.string().optional().describe("Site URL. Use gsc_list_sites to find available sites."),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      limit: z.number().optional().default(25).describe("Max rows to return"),
      pageFilter: z.string().optional().describe("Filter to queries for a specific page URL (contains match)"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("google", config);
      const site = resolveSiteUrl(params.siteUrl);
      if (!site) return errorResponse("No Site URL provided. Use gsc_list_sites to find your site.");
      return handleToolError(async () => {
        const client = getWebmastersClient(config.google!);
        const text = await getTopQueries(client, site, {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit ?? 25,
          pageFilter: params.pageFilter,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gsc_top_pages",
    "Get the top pages appearing in Google Search results, sorted by clicks. Shows page URL, clicks, impressions, CTR, and average position.",
    {
      siteUrl: z.string().optional().describe("Site URL. Use gsc_list_sites to find available sites."),
      startDate: z.string().describe("Start date YYYY-MM-DD"),
      endDate: z.string().describe("End date YYYY-MM-DD"),
      limit: z.number().optional().default(25).describe("Max rows to return"),
      queryFilter: z.string().optional().describe("Filter to pages matching a specific query (contains match)"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("google", config);
      const site = resolveSiteUrl(params.siteUrl);
      if (!site) return errorResponse("No Site URL provided. Use gsc_list_sites to find your site.");
      return handleToolError(async () => {
        const client = getWebmastersClient(config.google!);
        const text = await getTopPages(client, site, {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit ?? 25,
          queryFilter: params.queryFilter,
        });
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gsc_inspect_url",
    "Inspect a URL to see its Google indexing status, crawl info, mobile usability, and any issues. Useful for debugging why a page isn't appearing in search.",
    {
      siteUrl: z.string().optional().describe("Site URL. Use gsc_list_sites to find available sites."),
      url: z.string().describe("The fully qualified URL to inspect, e.g. https://example.com/page"),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("google", config);
      const site = resolveSiteUrl(params.siteUrl);
      if (!site) return errorResponse("No Site URL provided. Use gsc_list_sites to find your site.");
      return handleToolError(async () => {
        const client = getSearchConsoleClient(config.google!);
        const text = await inspectUrl(client, site, params.url);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );

  server.tool(
    "gsc_list_sitemaps",
    "List all sitemaps submitted for the site, including their status, last download date, and number of URLs submitted/indexed.",
    {
      siteUrl: z.string().optional().describe("Site URL. Use gsc_list_sites to find available sites."),
    },
    async (params) => {
      if (!hasGoogleAuth) return notConfiguredResponse("google", config);
      const site = resolveSiteUrl(params.siteUrl);
      if (!site) return errorResponse("No Site URL provided. Use gsc_list_sites to find your site.");
      return handleToolError(async () => {
        const client = getWebmastersClient(config.google!);
        const text = await listSitemaps(client, site);
        return { content: [{ type: "text" as const, text }] };
      });
    },
  );
}
