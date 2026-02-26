import bizSdk from "facebook-nodejs-business-sdk";
import { markdownTable, formatNumber, formatDollars, formatPercent } from "../../utils/formatters.js";

export async function getAdsetInsights(
  accountId: string,
  startDate: string,
  endDate: string,
  campaignId: string | undefined,
  limit: number,
): Promise<string> {
  const account = new bizSdk.AdAccount(accountId);

  const params: Record<string, any> = {
    time_range: { since: startDate, until: endDate },
    level: "adset",
    limit,
  };

  if (campaignId) {
    params.filtering = [
      { field: "campaign.id", operator: "EQUAL", value: campaignId },
    ];
  }

  const insights = await account.getInsights(
    [
      "adset_name", "adset_id", "campaign_name", "spend", "impressions",
      "clicks", "ctr", "cpc", "actions",
    ],
    params,
  );

  if (!insights || insights.length === 0) {
    return `No ad set data found for ${accountId} from ${startDate} to ${endDate}.`;
  }

  const headers = ["Ad Set", "Campaign", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Conversions"];
  const rows = insights.map((row: any) => {
    const conversions = (row.actions || [])
      .filter((a: any) => ["purchase", "lead", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type))
      .reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0);

    return [
      (row.adset_name || "").substring(0, 35),
      (row.campaign_name || "").substring(0, 25),
      formatDollars(row.spend || 0),
      formatNumber(row.impressions || 0),
      formatNumber(row.clicks || 0),
      formatPercent(row.ctr || 0, true),
      formatDollars(row.cpc || 0),
      formatNumber(conversions),
    ];
  });

  return `**Ad Set Insights: ${accountId}** (${startDate} to ${endDate})\n\n` + markdownTable(headers, rows);
}
