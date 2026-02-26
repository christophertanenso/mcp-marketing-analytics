import type { searchconsole_v1 } from "googleapis";

export async function inspectUrl(
  client: searchconsole_v1.Searchconsole,
  siteUrl: string,
  url: string,
): Promise<string> {
  const response = await client.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      siteUrl,
    },
  });

  const result = response.data.inspectionResult;
  if (!result) {
    return `No inspection data returned for ${url}.`;
  }

  const indexStatus = result.indexStatusResult;
  const mobileUsability = result.mobileUsabilityResult;

  let output = `**URL Inspection: ${url}**\n\n`;

  if (indexStatus) {
    output += `### Indexing\n`;
    output += `- **Coverage State:** ${indexStatus.coverageState || "Unknown"}\n`;
    output += `- **Indexing State:** ${indexStatus.indexingState || "Unknown"}\n`;
    output += `- **Last Crawl Time:** ${indexStatus.lastCrawlTime || "Never"}\n`;
    output += `- **Page Fetch State:** ${indexStatus.pageFetchState || "Unknown"}\n`;
    output += `- **Robots.txt State:** ${indexStatus.robotsTxtState || "Unknown"}\n`;
    output += `- **Crawled As:** ${indexStatus.crawledAs || "Unknown"}\n`;

    if (indexStatus.referringUrls && indexStatus.referringUrls.length > 0) {
      output += `- **Referring URLs:** ${indexStatus.referringUrls.join(", ")}\n`;
    }

    if (indexStatus.sitemap && indexStatus.sitemap.length > 0) {
      output += `- **Sitemaps:** ${indexStatus.sitemap.join(", ")}\n`;
    }
  }

  if (mobileUsability) {
    output += `\n### Mobile Usability\n`;
    output += `- **Verdict:** ${mobileUsability.verdict || "Unknown"}\n`;
    if (mobileUsability.issues && mobileUsability.issues.length > 0) {
      output += `- **Issues:**\n`;
      for (const issue of mobileUsability.issues) {
        output += `  - ${issue.issueType}: ${issue.severity}\n`;
      }
    }
  }

  return output;
}
