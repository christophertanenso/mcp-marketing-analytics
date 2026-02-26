/**
 * Interactive auth setup helper for the Marketing Analytics MCP server.
 * Run with: npm run setup
 *
 * This script helps you obtain the OAuth2 refresh token for Google APIs
 * and provides guidance for Meta and Google Ads tokens.
 */

import http from "node:http";
import { URL } from "node:url";
import { OAuth2Client } from "google-auth-library";
import open from "open";
import readline from "node:readline";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/adwords",
];

const REDIRECT_PORT = 3847;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function divider() {
  console.log("\n" + "=".repeat(60) + "\n");
}

async function setupGoogleOAuth(): Promise<{ clientId: string; clientSecret: string; refreshToken: string } | null> {
  console.log("STEP 1: Google OAuth2 Setup");
  console.log("---------------------------");
  console.log("This is used for GA4, Google Search Console, and Google Ads.\n");
  console.log("Prerequisites:");
  console.log("  1. Go to https://console.cloud.google.com/apis/credentials");
  console.log("  2. Create a project (or select existing)");
  console.log("  3. Enable these APIs:");
  console.log("     - Google Analytics Data API");
  console.log("     - Google Search Console API");
  console.log("     - Google Ads API (if needed)");
  console.log("  4. Create OAuth 2.0 Client ID (Application type: Web application)");
  console.log(`  5. Add ${REDIRECT_URI} as an Authorized redirect URI`);
  console.log("  6. Copy your Client ID and Client Secret\n");

  const clientId = await prompt("Enter your Google Client ID (or press Enter to skip): ");
  if (!clientId) {
    console.log("Skipping Google OAuth setup.");
    return null;
  }

  const clientSecret = await prompt("Enter your Google Client Secret: ");
  if (!clientSecret) {
    console.log("Client Secret is required. Skipping Google OAuth setup.");
    return null;
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
  });

  console.log("\nOpening browser for Google authorization...");
  console.log(`If the browser doesn't open, visit this URL manually:\n${authUrl}\n`);

  // Start local server to capture the callback
  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const authCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<h1>Authorization Failed</h1><p>Error: ${error}</p><p>You can close this window.</p>`);
        server.close();
        reject(new Error(`Authorization failed: ${error}`));
        return;
      }

      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<h1>Authorization Successful!</h1><p>You can close this window and return to the terminal.</p>`);
        server.close();
        resolve(authCode);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      open(authUrl).catch(() => {
        console.log("Could not open browser automatically. Please visit the URL above.");
      });
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 2 minutes."));
    }, 120000);
  });

  console.log("Authorization code received. Exchanging for tokens...");

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.log("\nWARNING: No refresh token received.");
    console.log("This usually means you've already authorized this app before.");
    console.log("To fix: Go to https://myaccount.google.com/permissions");
    console.log("Remove access for your app, then run this setup again.\n");
    return null;
  }

  console.log("\nGoogle OAuth2 tokens obtained successfully!");
  return {
    clientId,
    clientSecret,
    refreshToken: tokens.refresh_token,
  };
}

async function setupMeta(): Promise<string | null> {
  divider();
  console.log("STEP 2: Meta (Facebook) Ads Token Setup");
  console.log("----------------------------------------");
  console.log("You need a long-lived access token with ads_read permission.\n");
  console.log("Option A: Quick setup (token expires in ~60 days)");
  console.log("  1. Go to https://developers.facebook.com/tools/explorer/");
  console.log("  2. Select your app (or create one at https://developers.facebook.com/apps/)");
  console.log("  3. Click 'Generate Access Token'");
  console.log("  4. Add permission: ads_read");
  console.log("  5. Copy the short-lived token");
  console.log("  6. Exchange it for a long-lived token at:");
  console.log("     https://developers.facebook.com/tools/debug/accesstoken/");
  console.log("     Click 'Extend Access Token'\n");
  console.log("Option B: Permanent setup (recommended for production)");
  console.log("  1. Go to Business Manager > Business Settings > System Users");
  console.log("  2. Create a System User");
  console.log("  3. Generate a token with ads_read permission\n");

  const token = await prompt("Paste your Meta access token (or press Enter to skip): ");
  if (!token) {
    console.log("Skipping Meta setup.");
    return null;
  }
  return token;
}

async function setupGoogleAds(): Promise<{ developerToken: string; customerId: string } | null> {
  divider();
  console.log("STEP 3: Google Ads Setup");
  console.log("------------------------");
  console.log("You need a Developer Token and Customer Account ID.\n");
  console.log("  1. Sign in to Google Ads at https://ads.google.com");
  console.log("  2. Go to Tools & Settings > API Center");
  console.log("  3. Apply for a developer token (Basic access is enough for read-only)");
  console.log("  4. Note your Customer ID from the top-right of Google Ads (10 digits)\n");

  const developerToken = await prompt("Enter your Developer Token (or press Enter to skip): ");
  if (!developerToken) {
    console.log("Skipping Google Ads setup.");
    return null;
  }

  const customerId = await prompt("Enter your Customer Account ID (10 digits, no dashes): ");
  if (!customerId) {
    console.log("Customer ID is required. Skipping Google Ads setup.");
    return null;
  }

  return { developerToken, customerId };
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Marketing Analytics MCP Server - Auth Setup");
  console.log("=".repeat(60));
  console.log("\nThis wizard will help you get the API tokens needed");
  console.log("for GA4, Google Search Console, Meta Ads, and Google Ads.\n");

  // Step 1: Google OAuth
  const google = await setupGoogleOAuth();

  // Step 2: Meta
  const metaToken = await setupMeta();

  // Step 3: Google Ads
  const googleAds = await setupGoogleAds();

  // Step 4: Additional info
  divider();
  console.log("STEP 4: Additional Configuration");
  console.log("---------------------------------\n");

  let ga4PropertyId = "";
  let gscSiteUrl = "";

  if (google) {
    ga4PropertyId = await prompt("Enter your GA4 Property ID (found in GA4 Admin > Property Details, or press Enter to skip): ");
    gscSiteUrl = await prompt("Enter your Search Console site URL (e.g. https://example.com or sc-domain:example.com, or press Enter to skip): ");
  }

  // Generate .env content
  divider();
  console.log("SETUP COMPLETE! Here are your environment variables:\n");
  console.log("Copy the following into a .env file in this project directory:\n");
  console.log("-".repeat(60));

  let envContent = "# Generated by setup-auth\n\n";

  if (google) {
    envContent += `GOOGLE_CLIENT_ID=${google.clientId}\n`;
    envContent += `GOOGLE_CLIENT_SECRET=${google.clientSecret}\n`;
    envContent += `GOOGLE_REFRESH_TOKEN=${google.refreshToken}\n\n`;
  }

  if (ga4PropertyId) {
    envContent += `GA4_PROPERTY_ID=${ga4PropertyId}\n\n`;
  }

  if (gscSiteUrl) {
    envContent += `GSC_SITE_URL=${gscSiteUrl}\n\n`;
  }

  if (metaToken) {
    envContent += `META_ACCESS_TOKEN=${metaToken}\n\n`;
  }

  if (googleAds) {
    envContent += `GOOGLE_ADS_DEVELOPER_TOKEN=${googleAds.developerToken}\n`;
    envContent += `GOOGLE_ADS_CUSTOMER_ID=${googleAds.customerId}\n\n`;
  }

  console.log(envContent);
  console.log("-".repeat(60));

  // Offer to write .env file
  const writeFile = await prompt("\nWrite this to .env file? (y/n): ");
  if (writeFile.toLowerCase() === "y") {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const envPath = path.join(process.cwd(), ".env");

    if (fs.existsSync(envPath)) {
      const overwrite = await prompt(".env already exists. Overwrite? (y/n): ");
      if (overwrite.toLowerCase() !== "y") {
        console.log("Skipped writing .env file.");
        return;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log("\n.env file written successfully!");
  }

  console.log("\nNext steps:");
  console.log("  1. Run: npm run build");
  console.log("  2. Add to Claude Code:");
  console.log(`     claude mcp add marketing-analytics -- node "${process.cwd().replace(/\\/g, "/")}/dist/index.js"`);
  console.log("\nOr add to Claude Desktop config at:");
  console.log("  %APPDATA%\\Claude\\claude_desktop_config.json");
  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});
