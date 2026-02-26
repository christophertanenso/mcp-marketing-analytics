import type { Customer } from "google-ads-api";
import { markdownTable, formatNumber, formatCurrency } from "../../utils/formatters.js";

export async function getAdGroupPerformance(
  customer: Customer,
  params: {
    dateRange: string;
    campaignName?: string;
    limit: number;
    orderBy: string;
  },
): Promise<string> {
  let query = `
    SELECT
      ad_group.name,
      ad_group.status,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.average_cpc,
      metrics.conversions,
      metrics.conversions_from_interactions_rate
    FROM ad_group
    WHERE segments.date DURING ${params.dateRange}
  `;

  if (params.campaignName) {
    query += ` AND campaign.name = '${params.campaignName.replace(/'/g, "\\'")}'`;
  }

  const orderMetric = {
    cost: "metrics.cost_micros",
    clicks: "metrics.clicks",
    conversions: "metrics.conversions",
    impressions: "metrics.impressions",
  }[params.orderBy] || "metrics.cost_micros";

  query += ` ORDER BY ${orderMetric} DESC LIMIT ${params.limit}`;

  const results = await customer.query(query);

  if (!results || results.length === 0) {
    return `No ad group data found for ${params.dateRange}.`;
  }

  const headers = ["Ad Group", "Campaign", "Status", "Impressions", "Clicks", "CTR", "Cost", "CPC", "Conversions", "Conv Rate"];
  const rows = results.map((row: any) => {
    const ag = row.ad_group || {};
    const c = row.campaign || {};
    const m = row.metrics || {};
    return [
      (ag.name || "").substring(0, 30),
      (c.name || "").substring(0, 25),
      ag.status || "",
      formatNumber(m.impressions || 0),
      formatNumber(m.clicks || 0),
      ((m.ctr || 0) * 100).toFixed(2) + "%",
      formatCurrency(m.cost_micros || 0),
      formatCurrency(m.average_cpc || 0),
      formatNumber(Math.round(m.conversions || 0)),
      ((m.conversions_from_interactions_rate || 0) * 100).toFixed(2) + "%",
    ];
  });

  return `**Google Ads Ad Group Performance** (${params.dateRange})\n\n` + markdownTable(headers, rows);
}
