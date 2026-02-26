import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { markdownTable } from "../../utils/formatters.js";

export async function listGA4Accounts(auth: OAuth2Client): Promise<string> {
  const admin = google.analyticsadmin({ version: "v1beta", auth });

  // List all account summaries (includes properties)
  const response = await admin.accountSummaries.list({ pageSize: 200 });
  const summaries = response.data.accountSummaries;

  if (!summaries || summaries.length === 0) {
    return "No GA4 accounts found for the authenticated user.";
  }

  const headers = ["Account", "Property Name", "Property ID"];
  const rows: string[][] = [];

  for (const account of summaries) {
    const accountName = account.displayName || account.account || "";
    const properties = account.propertySummaries || [];
    for (const prop of properties) {
      const propertyId = (prop.property || "").replace("properties/", "");
      rows.push([
        accountName,
        prop.displayName || "",
        propertyId,
      ]);
    }
  }

  if (rows.length === 0) {
    return "Accounts found but no GA4 properties available.";
  }

  return `**GA4 Properties** (${rows.length} found)\n\nUse the Property ID with any ga4_* tool.\n\n` + markdownTable(headers, rows);
}
