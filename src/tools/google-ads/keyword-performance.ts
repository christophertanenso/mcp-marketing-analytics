import type { Customer } from "google-ads-api";
import { markdownTable, formatNumber, formatCurrency } from "../../utils/formatters.js";

export async function getKeywordPerformance(
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
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.name,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.average_cpc,
      metrics.conversions,
      ad_group_criterion.quality_info.quality_score
    FROM keyword_view
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
  }[params.orderBy] || "metrics.clicks";

  query += ` ORDER BY ${orderMetric} DESC LIMIT ${params.limit}`;

  const results = await customer.query(query);

  if (!results || results.length === 0) {
    return `No keyword data found for ${params.dateRange}.`;
  }

  const headers = ["Keyword", "Match", "Campaign", "Ad Group", "Clicks", "Impr", "CTR", "Cost", "CPC", "Conv", "QS"];
  const rows = results.map((row: any) => {
    const kw = row.ad_group_criterion?.keyword || {};
    const c = row.campaign || {};
    const ag = row.ad_group || {};
    const m = row.metrics || {};
    const qi = row.ad_group_criterion?.quality_info || {};

    return [
      (kw.text || "").substring(0, 30),
      (kw.match_type || "").replace("_", " "),
      (c.name || "").substring(0, 20),
      (ag.name || "").substring(0, 20),
      formatNumber(m.clicks || 0),
      formatNumber(m.impressions || 0),
      ((m.ctr || 0) * 100).toFixed(2) + "%",
      formatCurrency(m.cost_micros || 0),
      formatCurrency(m.average_cpc || 0),
      formatNumber(Math.round(m.conversions || 0)),
      qi.quality_score != null ? String(qi.quality_score) : "N/A",
    ];
  });

  return `**Google Ads Keyword Performance** (${params.dateRange})\n\n` + markdownTable(headers, rows);
}
