import bizSdk from "facebook-nodejs-business-sdk";
import { markdownTable, formatNumber, formatDollars, formatPercent } from "../../utils/formatters.js";

export async function getAdInsights(
  accountId: string,
  startDate: string,
  endDate: string,
  campaignId: string | undefined,
  adsetId: string | undefined,
  limit: number,
): Promise<string> {
  const account = new bizSdk.AdAccount(accountId);

  const params: Record<string, any> = {
    time_range: { since: startDate, until: endDate },
    level: "ad",
    limit,
  };

  const filters: any[] = [];
  if (campaignId) {
    filters.push({ field: "campaign.id", operator: "EQUAL", value: campaignId });
  }
  if (adsetId) {
    filters.push({ field: "adset.id", operator: "EQUAL", value: adsetId });
  }
  if (filters.length > 0) {
    params.filtering = filters;
  }

  const insights = await account.getInsights(
    [
      "ad_name", "ad_id", "adset_name", "campaign_name", "spend",
      "impressions", "clicks", "ctr", "actions",
    ],
    params,
  );

  if (!insights || insights.length === 0) {
    return `No ad data found for ${accountId} from ${startDate} to ${endDate}.`;
  }

  const headers = ["Ad", "Ad Set", "Campaign", "Spend", "Impressions", "Clicks", "CTR", "Conversions"];
  const rows = insights.map((row: any) => {
    const conversions = (row.actions || [])
      .filter((a: any) => ["purchase", "lead", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type))
      .reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0);

    return [
      (row.ad_name || "").substring(0, 30),
      (row.adset_name || "").substring(0, 25),
      (row.campaign_name || "").substring(0, 20),
      formatDollars(row.spend || 0),
      formatNumber(row.impressions || 0),
      formatNumber(row.clicks || 0),
      formatPercent(row.ctr || 0, true),
      formatNumber(conversions),
    ];
  });

  return `**Ad Insights: ${accountId}** (${startDate} to ${endDate})\n\n` + markdownTable(headers, rows);
}
