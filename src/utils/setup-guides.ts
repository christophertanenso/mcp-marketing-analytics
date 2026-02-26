import type { AppConfig } from "../types/index.js";

function getProjectPath(): string {
  return process.cwd().replace(/\\/g, "/");
}

export function googleOAuthSetupGuide(): string {
  const projectPath = getProjectPath();
  return `## Google OAuth2 Setup (Required for GA4, Search Console, and Google Ads)

You need a Google Cloud OAuth2 Client ID with a refresh token. Follow these steps:

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select **New Project**
3. Name it something like "Marketing Analytics MCP" and click **Create**
4. Select the new project from the dropdown

### Step 2: Enable APIs
Go to **APIs & Services > Library** and enable each of these:
- [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com) — for GA4 reporting
- [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com) — for listing GA4 properties
- [Google Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com) — for search performance data
- [Google Ads API](https://console.cloud.google.com/apis/library/googleads.googleapis.com) — only if you need Google Ads data (optional)

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Fill in App name, User support email, and Developer contact email
4. On the Scopes page, add:
   - \`https://www.googleapis.com/auth/analytics.readonly\`
   - \`https://www.googleapis.com/auth/webmasters.readonly\`
   - \`https://www.googleapis.com/auth/adwords\` (if using Google Ads)
5. Add your Google account as a **Test User**
6. Click **Save and Continue** through the remaining steps

### Step 4: Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, add: \`http://localhost:3847/callback\`
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### Step 5: Get Your Refresh Token
Run the interactive setup wizard from your terminal:
\`\`\`
cd ${projectPath}
npm run setup
\`\`\`
This opens a browser for you to authorize access, then gives you the refresh token automatically.

### Step 6: Set Environment Variables
Add these to a \`.env\` file in the project directory (\`${projectPath}/.env\`):
\`\`\`
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
\`\`\`

Then restart the MCP server for changes to take effect.

**Optional defaults** (can also be selected at runtime via \`ga4_list_accounts\` / \`gsc_list_sites\`):
\`\`\`
GA4_PROPERTY_ID=123456789
GSC_SITE_URL=https://www.example.com
\`\`\``;
}

export function metaAdsSetupGuide(): string {
  const projectPath = getProjectPath();
  return `## Meta (Facebook) Ads Setup

You need a Meta access token with \`ads_read\` permission.

### Option A: Quick Setup (token expires in ~60 days)
1. Go to [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app (or [create one](https://developers.facebook.com/apps/))
3. Click **Generate Access Token**
4. Add the permission: \`ads_read\`
5. Copy the short-lived token
6. Go to the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
7. Paste your token and click **Debug**
8. Click **Extend Access Token** to get a long-lived token (~60 days)

### Option B: Permanent Token (recommended for production)
1. Go to [Meta Business Manager](https://business.facebook.com/) > **Business Settings > System Users**
2. Create a System User with **Admin** role
3. Generate a token with \`ads_read\` permission

### Set Environment Variables
Add to \`${projectPath}/.env\`:
\`\`\`
META_ACCESS_TOKEN=your-long-lived-access-token
\`\`\`

Optional (for app secret proof, improves security):
\`\`\`
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
\`\`\`

Then restart the MCP server for changes to take effect.`;
}

export function googleAdsSetupGuide(): string {
  const projectPath = getProjectPath();
  return `## Google Ads Setup

Google Ads requires Google OAuth2 credentials (see above) **plus** a Developer Token and Customer Account ID.

### Step 1: Get a Developer Token
1. Sign in to [Google Ads](https://ads.google.com)
2. If you don't have a Manager Account, create one at [Google Ads Manager Accounts](https://ads.google.com/home/tools/manager-accounts/)
3. Go to **Tools & Settings > Setup > API Center**
4. Apply for a Developer Token (Basic access is sufficient for read-only)
5. Note: Approval may take a few days for new accounts

### Step 2: Find Your Customer Account ID
1. In Google Ads, look at the top-right corner
2. Your Customer ID is the 10-digit number (format: XXX-XXX-XXXX)
3. Remove the dashes when entering it below

### Set Environment Variables
Add to \`${projectPath}/.env\`:
\`\`\`
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
\`\`\`

If accessing client accounts through an MCC manager account, also add:
\`\`\`
GOOGLE_ADS_LOGIN_CUSTOMER_ID=9876543210
\`\`\`

Then restart the MCP server for changes to take effect.`;
}

export type ApiFamily = "google" | "meta" | "googleAds";

export function setupInstructionsFor(apiFamily: ApiFamily, config: AppConfig): string {
  const parts: string[] = [];

  switch (apiFamily) {
    case "google":
      parts.push("## Google OAuth2 is not configured\n");
      parts.push("This is needed for **GA4** and **Search Console** tools.\n");
      parts.push(googleOAuthSetupGuide());
      break;
    case "meta":
      parts.push("## Meta Ads is not configured\n");
      parts.push(metaAdsSetupGuide());
      break;
    case "googleAds":
      parts.push("## Google Ads is not configured\n");
      if (!config.google) {
        parts.push("Google Ads requires Google OAuth2, which is also not configured. Set up Google OAuth2 first:\n");
        parts.push(googleOAuthSetupGuide());
        parts.push("\n---\n");
        parts.push("Once Google OAuth2 is configured, also complete the Google Ads setup:\n");
      }
      parts.push(googleAdsSetupGuide());
      break;
  }

  parts.push("\n\n---\n*Tip: Call the `setup_guide` tool for the complete setup walkthrough.*");
  return parts.join("\n");
}

export function fullSetupGuide(config: AppConfig): string {
  const googleStatus = config.google ? "CONFIGURED" : "NOT CONFIGURED";
  const metaStatus = config.meta ? "CONFIGURED" : "NOT CONFIGURED";
  const googleAdsStatus = config.googleAds ? "CONFIGURED" : "NOT CONFIGURED";

  const parts: string[] = [];

  parts.push("# Marketing Analytics MCP — Setup Guide\n");
  parts.push("## Current Status");
  parts.push(`- Google OAuth2 (GA4 + Search Console): **${googleStatus}**`);
  parts.push(`- Meta Ads: **${metaStatus}**`);
  parts.push(`- Google Ads: **${googleAdsStatus}**`);
  parts.push("");

  const allConfigured = config.google && config.meta && config.googleAds;

  if (allConfigured) {
    parts.push("All APIs are configured! You're ready to use all tools.");
    parts.push("");
    parts.push("**Available tools:**");
    parts.push("- `ga4_list_accounts`, `ga4_run_report`, `ga4_realtime_report`, `ga4_top_pages`, `ga4_traffic_sources`, `ga4_user_metrics`");
    parts.push("- `gsc_list_sites`, `gsc_search_analytics`, `gsc_top_queries`, `gsc_top_pages`, `gsc_inspect_url`, `gsc_list_sitemaps`");
    parts.push("- `meta_list_ad_accounts`, `meta_account_overview`, `meta_campaign_insights`, `meta_adset_insights`, `meta_ad_insights`");
    parts.push("- `gads_query`, `gads_campaign_performance`, `gads_keyword_performance`, `gads_ad_group_performance`, `gads_account_summary`");
  } else {
    parts.push("Follow the guides below for any APIs marked as **NOT CONFIGURED**.\n");

    if (!config.google) {
      parts.push("---\n");
      parts.push(googleOAuthSetupGuide());
      parts.push("");
    }

    if (!config.meta) {
      parts.push("---\n");
      parts.push(metaAdsSetupGuide());
      parts.push("");
    }

    if (!config.googleAds) {
      parts.push("---\n");
      parts.push(googleAdsSetupGuide());
      parts.push("");
    }
  }

  return parts.join("\n");
}
