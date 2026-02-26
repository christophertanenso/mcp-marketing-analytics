import bizSdk from "facebook-nodejs-business-sdk";
import { markdownTable } from "../../utils/formatters.js";

const STATUS_MAP: Record<number, string> = {
  1: "ACTIVE",
  2: "DISABLED",
  3: "UNSETTLED",
  7: "PENDING_RISK_REVIEW",
  8: "PENDING_SETTLEMENT",
  9: "IN_GRACE_PERIOD",
  100: "PENDING_CLOSURE",
  101: "CLOSED",
  201: "ANY_ACTIVE",
  202: "ANY_CLOSED",
};

export async function listAdAccounts(
  limit: number,
): Promise<string> {
  const user = new bizSdk.User("me");
  const accounts = await user.getAdAccounts(
    ["account_id", "name", "account_status", "currency", "timezone_name"],
    { limit },
  );

  if (!accounts || accounts.length === 0) {
    return "No ad accounts found for the current user.";
  }

  const headers = ["Account ID", "Name", "Status", "Currency", "Timezone"];
  const rows = accounts.map((acct: any) => [
    `act_${acct.account_id}`,
    acct.name || "",
    STATUS_MAP[acct.account_status] || String(acct.account_status),
    acct.currency || "",
    acct.timezone_name || "",
  ]);

  return `**Meta Ad Accounts**\n\n` + markdownTable(headers, rows);
}
