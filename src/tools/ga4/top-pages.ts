import type { analyticsdata_v1beta } from "googleapis";
import { markdownTable, formatNumber, formatDuration } from "../../utils/formatters.js";

export async function getTopPages(
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
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: String(params.limit),
    },
  });

  const data = response.data;
  if (!data.rows || data.rows.length === 0) {
    return `No page data found for ${params.startDate} to ${params.endDate}.`;
  }

  const headers = ["Page Path", "Page Title", "Views", "Users", "Avg Duration"];
  const rows = data.rows.map((row: any) => {
    const dims = row.dimensionValues || [];
    const mets = row.metricValues || [];
    return [
      dims[0]?.value || "",
      (dims[1]?.value || "").substring(0, 50),
      formatNumber(mets[0]?.value || "0"),
      formatNumber(mets[1]?.value || "0"),
      formatDuration(mets[2]?.value || "0"),
    ];
  });

  return `**Top Pages** (${params.startDate} to ${params.endDate})\n\n` + markdownTable(headers, rows);
}
