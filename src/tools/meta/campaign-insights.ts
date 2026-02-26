import bizSdk from "facebook-nodejs-business-sdk";
import { markdownTable, formatNumber, formatDollars, formatPercent } from "../../utils/formatters.js";

export async function getCampaignInsights(
  accountId: string,
  startDate: string,
  endDate: string,
  status: string,
  limit: number,
): Promise<string> {
  const account = new bizSdk.AdAccount(accountId);

  const params: Record<string, any> = {
    time_range: { since: startDate, until: endDate },
    level: "campaign",
    limit,
  };

  if (status !== "all") {
    params.filtering = [
      { field: "campaign.effective_status", operator: "IN", value: [status] },
    ];
  }

  const insights = await account.getInsights(
    [
      "campaign_name", "campaign_id", "spend", "impressions", "clicks",
      "ctr", "cpc", "actions", "objective",
    ],
    params,
  );

  if (!insights || insights.length === 0) {
    return `No campaign data found for ${accountId} from ${startDate} to ${endDate}.`;
  }

  const headers = ["Campaign", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Conversions"];
  const rows = insights.map((row: any) => {
    const conversions = (row.actions || [])
      .filter((a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase" || a.action_type === "lead" || a.action_type === "purchase")
      .reduce((sum: number, a: any) => sum + parseFloat(a.value || 0), 0);

    return [
      (row.campaign_name || "").substring(0, 40),
      formatDollars(row.spend || 0),
      formatNumber(row.impressions || 0),
      formatNumber(row.clicks || 0),
      formatPercent(row.ctr || 0, true),
      formatDollars(row.cpc || 0),
      formatNumber(conversions),
    ];
  });

  return `**Campaign Insights: ${accountId}** (${startDate} to ${endDate})\n\n` + markdownTable(headers, rows);
}
