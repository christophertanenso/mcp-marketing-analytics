import type { webmasters_v3 } from "googleapis";
import { markdownTable, formatNumber, formatPercent } from "../../utils/formatters.js";

export async function getTopQueries(
  client: webmasters_v3.Webmasters,
  siteUrl: string,
  params: {
    startDate: string;
    endDate: string;
    limit: number;
    pageFilter?: string;
  },
): Promise<string> {
  const requestBody: webmasters_v3.Schema$SearchAnalyticsQueryRequest = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: ["query"],
    rowLimit: params.limit,
  };

  if (params.pageFilter) {
    requestBody.dimensionFilterGroups = [{
      filters: [{
        dimension: "page",
        operator: "contains",
        expression: params.pageFilter,
      }],
    }];
  }

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody,
  });

  const rows = response.data.rows;
  if (!rows || rows.length === 0) {
    return `No query data found for ${params.startDate} to ${params.endDate}.`;
  }

  const headers = ["Query", "Clicks", "Impressions", "CTR", "Position"];
  const tableRows = rows.map(row => [
    (row.keys || [""])[0],
    formatNumber(row.clicks || 0),
    formatNumber(row.impressions || 0),
    formatPercent(row.ctr || 0),
    (row.position || 0).toFixed(1),
  ]);

  return `**Top Search Queries** (${params.startDate} to ${params.endDate})\n\n` + markdownTable(headers, tableRows);
}
