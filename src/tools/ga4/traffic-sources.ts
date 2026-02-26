import type { analyticsdata_v1beta } from "googleapis";
import { markdownTable, formatNumber, formatPercent, formatDuration } from "../../utils/formatters.js";

export async function getTrafficSources(
  client: analyticsdata_v1beta.Analyticsdata,
  propertyId: string,
  params: {
    startDate: string;
    endDate: string;
    limit: number;
  },
): Promise<string> {
  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: String(params.limit),
    },
  });

  const data = response.data;
  if (!data.rows || data.rows.length === 0) {
    return `No traffic source data found for ${params.startDate} to ${params.endDate}.`;
  }

  const headers = ["Source", "Medium", "Sessions", "Users", "Bounce Rate", "Avg Duration"];
  const rows = data.rows.map((row: any) => {
    const dims = row.dimensionValues || [];
    const mets = row.metricValues || [];
    return [
      dims[0]?.value || "(not set)",
      dims[1]?.value || "(not set)",
      formatNumber(mets[0]?.value || "0"),
      formatNumber(mets[1]?.value || "0"),
      formatPercent(mets[2]?.value || "0"),
      formatDuration(mets[3]?.value || "0"),
    ];
  });

  return `**Traffic Sources** (${params.startDate} to ${params.endDate})\n\n` + markdownTable(headers, rows);
}
