import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import type { GoogleAuthConfig } from "../types/index.js";

let oauth2Client: OAuth2Client | null = null;

export function getGoogleOAuth2Client(config: GoogleAuthConfig): OAuth2Client {
  if (!oauth2Client) {
    oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
    );
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }
  return oauth2Client;
}

export function getAnalyticsDataClient(config: GoogleAuthConfig) {
  const auth = getGoogleOAuth2Client(config);
  return google.analyticsdata({ version: "v1beta", auth });
}

export function getSearchConsoleClient(config: GoogleAuthConfig) {
  const auth = getGoogleOAuth2Client(config);
  return google.searchconsole({ version: "v1", auth });
}

export function getWebmastersClient(config: GoogleAuthConfig) {
  const auth = getGoogleOAuth2Client(config);
  return google.webmasters({ version: "v3", auth });
}
