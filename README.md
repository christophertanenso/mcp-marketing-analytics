# Marketing Analytics MCP Server

A Model Context Protocol (MCP) server that gives Claude access to **Google Analytics 4**, **Google Search Console**, **Meta Ads**, and **Google Ads**. Ask Claude about your marketing data in natural language.

## Tools (22 total)

### Google Analytics 4 (6 tools)
| Tool | Description |
|------|-------------|
| `ga4_list_accounts` | List all GA4 properties accessible to your Google account |
| `ga4_run_report` | Run a custom report with any dimensions/metrics |
| `ga4_realtime_report` | See active users right now |
| `ga4_top_pages` | Most viewed pages |
| `ga4_traffic_sources` | Traffic by source/medium |
| `ga4_user_metrics` | Summary with optional period-over-period comparison |

### Google Search Console (6 tools)
| Tool | Description |
|------|-------------|
| `gsc_list_sites` | List all Search Console sites you have access to |
| `gsc_search_analytics` | Flexible search analytics query |
| `gsc_top_queries` | Top search queries by clicks |
| `gsc_top_pages` | Top pages in search results |
| `gsc_inspect_url` | Check indexing status of any URL |
| `gsc_list_sitemaps` | List submitted sitemaps |

### Meta Ads (5 tools)
| Tool | Description |
|------|-------------|
| `meta_list_ad_accounts` | List accessible ad accounts |
| `meta_account_overview` | Account-level spend/performance |
| `meta_campaign_insights` | Campaign metrics |
| `meta_adset_insights` | Ad set metrics |
| `meta_ad_insights` | Individual ad metrics |

### Google Ads (5 tools)
| Tool | Description |
|------|-------------|
| `gads_query` | Execute raw GAQL queries |
| `gads_campaign_performance` | Campaign performance metrics |
| `gads_keyword_performance` | Keyword metrics + quality score |
| `gads_ad_group_performance` | Ad group metrics |
| `gads_account_summary` | Account totals + top campaigns |

## Quick Start

### 1. Clone and build

```bash
git clone https://github.com/YOUR_USERNAME/mcp-marketing-analytics.git
cd mcp-marketing-analytics
npm install
npm run build
```

### 2. Get your credentials

Run the interactive setup wizard:

```bash
npm run setup
```

Or manually create a `.env` file (see `.env.example`).

#### Google APIs (GA4 + Search Console + Google Ads)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project and enable:
   - Google Analytics Data API
   - Google Analytics Admin API
   - Google Search Console API
   - Google Ads API *(optional)*
3. Create OAuth 2.0 Client ID (Web application type)
4. Add `http://localhost:3847/callback` as an Authorized redirect URI
5. Run `npm run setup` to complete the OAuth flow and get your refresh token

#### Meta Ads *(optional)*

1. Go to [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Generate a token with `ads_read` permission
3. Exchange for a long-lived token (60-day expiry)

#### Google Ads *(optional)*

1. Create a [Manager Account](https://ads.google.com/home/tools/manager-accounts/)
2. Get a Developer Token from Tools & Settings → API Center
3. Note your Customer Account ID (10 digits)

### 3. Add to Claude Desktop

Edit `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "marketing-analytics": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-marketing-analytics/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_REFRESH_TOKEN": "your-refresh-token"
      }
    }
  }
}
```

### 4. Add to Claude Code

```bash
claude mcp add marketing-analytics -- node "/absolute/path/to/mcp-marketing-analytics/dist/index.js"
```

### 5. Restart Claude and start asking

- *"List my GA4 properties"*
- *"Show me top pages for the last 30 days"*
- *"What are my top search queries on Google?"*
- *"How are my Meta ad campaigns performing?"*
- *"Compare this month's traffic to last month"*

## Configuration

All API credentials are passed via environment variables. Only configure the APIs you need — unconfigured APIs will show a helpful message instead of crashing.

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | For Google APIs | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | For Google APIs | OAuth 2.0 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | For Google APIs | OAuth 2.0 Refresh Token |
| `GA4_PROPERTY_ID` | No | Default GA4 property (can be set per-request) |
| `GSC_SITE_URL` | No | Default GSC site (can be set per-request) |
| `META_ACCESS_TOKEN` | For Meta Ads | Long-lived access token |
| `META_APP_ID` | No | For app secret proof |
| `META_APP_SECRET` | No | For app secret proof |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | For Google Ads | From API Center |
| `GOOGLE_ADS_CUSTOMER_ID` | For Google Ads | 10-digit account ID |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | No | MCC manager account ID |

## Multi-Account Support

You don't need to hardcode property IDs or site URLs. Use the discovery tools:

1. `ga4_list_accounts` → shows all GA4 properties you can access
2. `gsc_list_sites` → shows all Search Console sites you can access
3. Pass `propertyId` or `siteUrl` to any tool to query a specific account

## License

MIT
