# Install the Marketing Analytics MCP Server

This MCP gives Claude tools to query **Google Analytics 4**, **Google Search Console**, **Meta Ads**, and **Google Ads** directly in conversation.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or [Claude Desktop](https://claude.ai/download)

## Step 1: Clone and build

```bash
git clone https://github.com/christophertanenso/mcp-marketing-analytics.git
cd mcp-marketing-analytics
npm install
npm run build
```

## Step 2: Add to Claude

### Claude Code

```bash
claude mcp add marketing-analytics -- node "/absolute/path/to/mcp-marketing-analytics/dist/index.js"
```

Replace `/absolute/path/to` with the actual path where you cloned the repo.

### Claude Desktop

Edit your config file:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

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

## Step 3: Set up your API credentials

Restart Claude, then ask:

> **"Call the setup_guide tool"**

It will detect which APIs are configured and walk you through setting up credentials for each one — step by step, with links and commands, right in the chat.

## What you get

| API | Tools |
|-----|-------|
| **Google Analytics 4** | List properties, run custom reports, realtime data, top pages, traffic sources, user metrics |
| **Google Search Console** | List sites, search analytics, top queries, top pages, URL inspection, sitemaps |
| **Meta Ads** | List accounts, account overview, campaign/adset/ad insights |
| **Google Ads** | Raw GAQL queries, campaign/keyword/ad group performance, account summary |

Only configure the APIs you need — unconfigured ones are simply skipped.
