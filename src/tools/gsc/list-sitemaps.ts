import type { webmasters_v3 } from "googleapis";
import { markdownTable, formatNumber } from "../../utils/formatters.js";

export async function listSitemaps(
  client: webmasters_v3.Webmasters,
  siteUrl: string,
): Promise<string> {
  const response = await client.sitemaps.list({ siteUrl });

  const sitemaps = response.data.sitemap;
  if (!sitemaps || sitemaps.length === 0) {
    return `No sitemaps found for ${siteUrl}.`;
  }

  const headers = ["Sitemap URL", "Type", "Status", "Last Downloaded", "Submitted", "Indexed"];

  const rows = sitemaps.map(sitemap => {
    const submitted = (sitemap.contents || []).reduce((sum, c) => sum + (c.submitted ? parseInt(c.submitted) : 0), 0);
    const indexed = (sitemap.contents || []).reduce((sum, c) => sum + (c.indexed ? parseInt(c.indexed) : 0), 0);

    return [
      sitemap.path || "",
      sitemap.type || "",
      sitemap.isPending ? "Pending" : "Processed",
      sitemap.lastDownloaded || "N/A",
      formatNumber(submitted),
      formatNumber(indexed),
    ];
  });

  return `**Sitemaps for ${siteUrl}**\n\n` + markdownTable(headers, rows);
}
