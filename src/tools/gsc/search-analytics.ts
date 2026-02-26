import type { webmasters_v3 } from "googleapis";
import { markdownTable, formatNumber, formatPercent } from "../../utils/formatters.js";

export async function searchAnalytics(
  client: webmasters_v3.Webmasters,
  siteUrl: string,
  params: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    rowLimit: number;
    searchType: string;
    filters?: Array<{
      dimension: string;
      operator: string;
      expression: string;
    }>;
  },
): Promise<string> {
  const requestBody: webmasters_v3.Schema$SearchAnalyticsQueryRequest = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions,
    rowLimit: params.rowLimit,
  };

  if (params.filters && params.filters.length > 0) {
    requestBody.dimensionFilterGroups = [{
      filters: params.filters.map(f => ({
        dimension: f.dimension,
        operator: f.operator,
        expression: f.expression,
      })),
    }];
  }

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody,
  });

  const rows = response.data.rows;
  if (!rows || rows.length === 0) {
    return `No search analytics data found for ${params.startDate} to ${params.endDate}.`;
  }

  const headers = [...params.dimensions, "Clicks", "Impressions", "CTR", "Position"];
  const tableRows = rows.map(row => {
    const keys = (row.keys || []).map(k => k || "");
    return [
      ...keys,
      formatNumber(row.clicks || 0),
      formatNumber(row.impressions || 0),
      formatPercent(row.ctr || 0),
      (row.position || 0).toFixed(1),
    ];
  });

  return `**Search Analytics** (${params.startDate} to ${params.endDate}, type: ${params.searchType})\n\n` + markdownTable(headers, tableRows);
}
