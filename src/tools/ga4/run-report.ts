import type { analyticsdata_v1beta } from "googleapis";
import { markdownTable, formatNumber, formatPercent, formatDuration } from "../../utils/formatters.js";

export async function runReport(
  client: analyticsdata_v1beta.Analyticsdata,
  propertyId: string,
  params: {
    dimensions: string[];
    metrics: string[];
    startDate: string;
    endDate: string;
    limit: number;
    dimensionFilter?: {
      fieldName: string;
      matchType: string;
      value: string;
    };
  },
): Promise<string> {
  const requestBody: analyticsdata_v1beta.Schema$RunReportRequest = {
    dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
    dimensions: params.dimensions.map(name => ({ name })),
    metrics: params.metrics.map(name => ({ name })),
    limit: String(params.limit),
  };

  if (params.dimensionFilter) {
    requestBody.dimensionFilter = {
      filter: {
        fieldName: params.dimensionFilter.fieldName,
        stringFilter: {
          matchType: params.dimensionFilter.matchType,
          value: params.dimensionFilter.value,
        },
      },
    };
  }

  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody,
  });

  const data = response.data;
  if (!data.rows || data.rows.length === 0) {
    return `No data found for ${params.startDate} to ${params.endDate}.`;
  }

  const dimHeaders = (data.dimensionHeaders || []).map(h => h.name || "");
  const metricHeaders = (data.metricHeaders || []).map(h => h.name || "");
  const headers = [...dimHeaders, ...metricHeaders];

  const rows = data.rows.map(row => {
    const dimValues = (row.dimensionValues || []).map(v => v.value || "");
    const metricValues = (row.metricValues || []).map((v, i) => {
      const name = metricHeaders[i] || "";
      const val = v.value || "0";
      if (name.toLowerCase().includes("rate") || name.toLowerCase().includes("ctr")) {
        return formatPercent(val);
      }
      if (name.toLowerCase().includes("duration") || name.toLowerCase().includes("time")) {
        return formatDuration(val);
      }
      return formatNumber(val);
    });
    return [...dimValues, ...metricValues];
  });

  const header = `**GA4 Report** (${params.startDate} to ${params.endDate}) — ${data.rowCount || rows.length} rows\n\n`;
  return header + markdownTable(headers, rows);
}
