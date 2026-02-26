import type { webmasters_v3 } from "googleapis";
import { markdownTable } from "../../utils/formatters.js";

export async function listSites(
  client: webmasters_v3.Webmasters,
): Promise<string> {
  const response = await client.sites.list();
  const sites = response.data.siteEntry;

  if (!sites || sites.length === 0) {
    return "No Search Console sites found for the authenticated user.";
  }

  const headers = ["Site URL", "Permission Level"];
  const rows = sites.map(site => [
    site.siteUrl || "",
    site.permissionLevel || "",
  ]);

  return `**Search Console Sites** (${rows.length} found)\n\nUse the Site URL with any gsc_* tool.\n\n` + markdownTable(headers, rows);
}
