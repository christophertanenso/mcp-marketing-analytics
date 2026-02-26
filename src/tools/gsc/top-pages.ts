import type { webmasters_v3 } from "googleapis";
import { markdownTable, formatNumber, formatPercent } from "../../utils/formatters.js";

export async function getTopPages(
  client: webmasters_v3.Webmasters,
  siteUrl: string,
  params: {
    startDate: string;
    endDate: string;
    limit: number;
    queryFilter?: string;
  },
): Promise<string> {
  const requestBody: webmasters_v3.Schema$SearchAnalyticsQueryRequest = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: ["page"],
    rowLimit: params.limit,
  };

  if (params.queryFilter) {
    requestBody.dimensionFilterGroups = [{
      filters: [{
        dimension: "query",
        operator: "contains",
        expression: params.queryFilter,
      }],
    }];
  }

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody,
  });

  const rows = response.data.rows;
  if (!rows || rows.length === 0) {
    return `No page data found for ${params.startDate} to ${params.endDate}.`;
  }

  const headers = ["Page", "Clicks", "Impressions", "CTR", "Position"];
  const tableRows = rows.map(row => [
    (row.keys || [""])[0],
    formatNumber(row.clicks || 0),
    formatNumber(row.impressions || 0),
    formatPercent(row.ctr || 0),
    (row.position || 0).toFixed(1),
  ]);

  return `**Top Pages in Search** (${params.startDate} to ${params.endDate})\n\n` + markdownTable(headers, tableRows);
}
