import type { analyticsdata_v1beta } from "googleapis";
import { formatNumber, formatPercent, formatDuration } from "../../utils/formatters.js";

export async function getUserMetrics(
  client: analyticsdata_v1beta.Analyticsdata,
  propertyId: string,
  params: {
    startDate: string;
    endDate: string;
    comparePreviousPeriod: boolean;
  },
): Promise<string> {
  const metricNames = [
    "totalUsers",
    "newUsers",
    "sessions",
    "screenPageViews",
    "bounceRate",
    "averageSessionDuration",
    "engagementRate",
  ];

  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
      metrics: metricNames.map(name => ({ name })),
    },
  });

  const data = response.data;
  const row = data.rows?.[0];
  if (!row) {
    return `No data found for ${params.startDate} to ${params.endDate}.`;
  }

  const values = (row.metricValues || []).map(v => v.value || "0");
  const [totalUsers, newUsers, sessions, pageViews, bounceRate, avgDuration, engagementRate] = values;

  let result = `**User Metrics Summary** (${params.startDate} to ${params.endDate})\n\n`;
  result += `- **Total Users:** ${formatNumber(totalUsers)}\n`;
  result += `- **New Users:** ${formatNumber(newUsers)}\n`;
  result += `- **Sessions:** ${formatNumber(sessions)}\n`;
  result += `- **Page Views:** ${formatNumber(pageViews)}\n`;
  result += `- **Bounce Rate:** ${formatPercent(bounceRate)}\n`;
  result += `- **Avg Session Duration:** ${formatDuration(avgDuration)}\n`;
  result += `- **Engagement Rate:** ${formatPercent(engagementRate)}\n`;

  if (params.comparePreviousPeriod) {
    // Calculate previous period dates
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);

    const prevStartStr = prevStart.toISOString().split("T")[0];
    const prevEndStr = prevEnd.toISOString().split("T")[0];

    const prevResponse = await client.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: prevStartStr, endDate: prevEndStr }],
        metrics: metricNames.map(name => ({ name })),
      },
    });

    const prevRow = prevResponse.data.rows?.[0];
    if (prevRow) {
      const prevValues = (prevRow.metricValues || []).map(v => parseFloat(v.value || "0"));
      const currValues = values.map(v => parseFloat(v));
      const labels = ["Total Users", "New Users", "Sessions", "Page Views", "Bounce Rate", "Avg Duration", "Engagement Rate"];

      result += `\n**Comparison with Previous Period** (${prevStartStr} to ${prevEndStr})\n\n`;
      for (let i = 0; i < labels.length; i++) {
        const curr = currValues[i];
        const prev = prevValues[i];
        if (prev === 0) {
          result += `- **${labels[i]}:** N/A (no previous data)\n`;
        } else {
          const change = ((curr - prev) / prev) * 100;
          const arrow = change > 0 ? "+" : "";
          result += `- **${labels[i]}:** ${arrow}${change.toFixed(1)}%\n`;
        }
      }
    }
  }

  return result;
}
