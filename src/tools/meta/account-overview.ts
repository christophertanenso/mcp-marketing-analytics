import bizSdk from "facebook-nodejs-business-sdk";
import { formatNumber, formatDollars, formatPercent, markdownTable } from "../../utils/formatters.js";

export async function getAccountOverview(
  accountId: string,
  startDate: string,
  endDate: string,
  breakdown: string,
): Promise<string> {
  const account = new bizSdk.AdAccount(accountId);

  const params: Record<string, any> = {
    time_range: { since: startDate, until: endDate },
    fields: ["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "actions", "cost_per_action_type"],
  };

  if (breakdown !== "none") {
    params.breakdowns = [breakdown];
  }

  const insights = await account.getInsights(
    ["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "actions", "cost_per_action_type"],
    params,
  );

  if (!insights || insights.length === 0) {
    return `No data found for ${accountId} from ${startDate} to ${endDate}.`;
  }

  if (breakdown !== "none") {
    const headers = [breakdown, "Spend", "Impressions", "Clicks", "CTR", "CPC", "CPM"];
    const rows = insights.map((row: any) => [
      row[breakdown] || "",
      formatDollars(row.spend || 0),
      formatNumber(row.impressions || 0),
      formatNumber(row.clicks || 0),
      formatPercent(row.ctr || 0, true),
      formatDollars(row.cpc || 0),
      formatDollars(row.cpm || 0),
    ]);
    return `**Account Overview: ${accountId}** (${startDate} to ${endDate}, by ${breakdown})\n\n` + markdownTable(headers, rows);
  }

  const row = insights[0] as any;
  const conversions = extractConversions(row.actions);

  let result = `**Account Overview: ${accountId}** (${startDate} to ${endDate})\n\n`;
  result += `- **Spend:** ${formatDollars(row.spend || 0)}\n`;
  result += `- **Impressions:** ${formatNumber(row.impressions || 0)}\n`;
  result += `- **Clicks:** ${formatNumber(row.clicks || 0)}\n`;
  result += `- **CTR:** ${formatPercent(row.ctr || 0, true)}\n`;
  result += `- **CPC:** ${formatDollars(row.cpc || 0)}\n`;
  result += `- **CPM:** ${formatDollars(row.cpm || 0)}\n`;

  if (conversions.length > 0) {
    result += `\n**Conversions:**\n`;
    for (const conv of conversions) {
      result += `- ${conv.type}: ${formatNumber(conv.value)}\n`;
    }
  }

  return result;
}

function extractConversions(actions: any[] | undefined): Array<{ type: string; value: number }> {
  if (!actions) return [];
  return actions
    .filter((a: any) => a.action_type && a.value)
    .map((a: any) => ({ type: a.action_type, value: parseFloat(a.value) }))
    .filter(a => a.value > 0);
}
