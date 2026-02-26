import type { Customer } from "google-ads-api";
import { markdownTable, formatNumber, formatCurrency } from "../../utils/formatters.js";

export async function getCampaignPerformance(
  customer: Customer,
  params: {
    dateRange: string;
    status: string;
    campaignType: string;
    limit: number;
    orderBy: string;
  },
): Promise<string> {
  let query = `
    SELECT
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.average_cpc,
      metrics.conversions,
      metrics.conversions_from_interactions_rate
    FROM campaign
    WHERE segments.date DURING ${params.dateRange}
  `;

  if (params.status !== "all") {
    query += ` AND campaign.status = '${params.status}'`;
  }
  if (params.campaignType !== "all") {
    query += ` AND campaign.advertising_channel_type = '${params.campaignType}'`;
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
    return `No campaign data found for ${params.dateRange}.`;
  }

  const headers = ["Campaign", "Type", "Status", "Impressions", "Clicks", "CTR", "Cost", "CPC", "Conversions", "Conv Rate"];
  const rows = results.map((row: any) => {
    const c = row.campaign || {};
    const m = row.metrics || {};
    return [
      (c.name || "").substring(0, 35),
      (c.advertising_channel_type || "").replace("_", " "),
      c.status || "",
      formatNumber(m.impressions || 0),
      formatNumber(m.clicks || 0),
      ((m.ctr || 0) * 100).toFixed(2) + "%",
      formatCurrency(m.cost_micros || 0),
      formatCurrency(m.average_cpc || 0),
      formatNumber(Math.round(m.conversions || 0)),
      ((m.conversions_from_interactions_rate || 0) * 100).toFixed(2) + "%",
    ];
  });

  return `**Google Ads Campaign Performance** (${params.dateRange})\n\n` + markdownTable(headers, rows);
}
