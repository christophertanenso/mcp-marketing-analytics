import type { Customer } from "google-ads-api";
import { formatNumber, formatCurrency, markdownTable } from "../../utils/formatters.js";

export async function getAccountSummary(
  customer: Customer,
  dateRange: string,
): Promise<string> {
  // Get aggregate account metrics
  const accountQuery = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM customer
    WHERE segments.date DURING ${dateRange}
  `;

  const accountResults = await customer.query(accountQuery);

  if (!accountResults || accountResults.length === 0) {
    return `No data found for ${dateRange}.`;
  }

  const m = accountResults[0].metrics || {} as any;

  let result = `**Google Ads Account Summary** (${dateRange})\n\n`;
  result += `- **Total Spend:** ${formatCurrency(m.cost_micros || 0)}\n`;
  result += `- **Total Impressions:** ${formatNumber(m.impressions || 0)}\n`;
  result += `- **Total Clicks:** ${formatNumber(m.clicks || 0)}\n`;
  result += `- **Avg CTR:** ${((m.ctr || 0) * 100).toFixed(2)}%\n`;
  result += `- **Avg CPC:** ${formatCurrency(m.average_cpc || 0)}\n`;
  result += `- **Total Conversions:** ${formatNumber(Math.round(m.conversions || 0))}\n`;
  result += `- **Cost per Conversion:** ${formatCurrency(m.cost_per_conversion || 0)}\n`;

  // Get top 5 campaigns by spend
  const topCampaignsQuery = `
    SELECT
      campaign.name,
      metrics.cost_micros,
      metrics.clicks,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING ${dateRange}
    ORDER BY metrics.cost_micros DESC
    LIMIT 5
  `;

  const campaignResults = await customer.query(topCampaignsQuery);

  if (campaignResults && campaignResults.length > 0) {
    result += `\n**Top 5 Campaigns by Spend:**\n\n`;
    const headers = ["Campaign", "Spend", "Clicks", "Conversions"];
    const rows = campaignResults.map((row: any) => [
      (row.campaign?.name || "").substring(0, 40),
      formatCurrency(row.metrics?.cost_micros || 0),
      formatNumber(row.metrics?.clicks || 0),
      formatNumber(Math.round(row.metrics?.conversions || 0)),
    ]);
    result += markdownTable(headers, rows);
  }

  return result;
}
