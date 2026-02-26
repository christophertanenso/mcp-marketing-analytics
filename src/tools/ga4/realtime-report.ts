import type { analyticsdata_v1beta } from "googleapis";
import { markdownTable, formatNumber } from "../../utils/formatters.js";

export async function runRealtimeReport(
  client: analyticsdata_v1beta.Analyticsdata,
  propertyId: string,
  params: {
    dimensions: string[];
    metrics: string[];
    limit: number;
  },
): Promise<string> {
  const response = await client.properties.runRealtimeReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dimensions: params.dimensions.map(name => ({ name })),
      metrics: params.metrics.map(name => ({ name })),
      limit: String(params.limit),
    },
  });

  const data = response.data;
  if (!data.rows || data.rows.length === 0) {
    return "No realtime data available right now.";
  }

  const dimHeaders = (data.dimensionHeaders || []).map((h: any) => h.name || "");
  const metricHeaders = (data.metricHeaders || []).map((h: any) => h.name || "");
  const headers = [...dimHeaders, ...metricHeaders];

  const rows = data.rows.map((row: any) => {
    const dimValues = (row.dimensionValues || []).map((v: any) => v.value || "");
    const metricValues = (row.metricValues || []).map((v: any) => formatNumber(v.value || "0"));
    return [...dimValues, ...metricValues];
  });

  // Get total active users if available
  let totalLine = "";
  if (data.totals && data.totals.length > 0) {
    const totalValues = (data.totals[0].metricValues || []).map((v: any) => v.value || "0");
    const totalActiveUsers = totalValues[0];
    if (totalActiveUsers) {
      totalLine = `\n\n**Total active users (last 30 min):** ${formatNumber(totalActiveUsers)}`;
    }
  }

  return `**GA4 Realtime Report** (last 30 minutes)\n\n` + markdownTable(headers, rows) + totalLine;
}
