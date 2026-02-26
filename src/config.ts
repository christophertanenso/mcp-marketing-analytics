import "dotenv/config";
import type { AppConfig } from "./types/index.js";

export function loadConfig(): AppConfig {
  const config: AppConfig = {};

  // Google OAuth2 (shared by GA4, GSC, Google Ads)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    config.google = { clientId, clientSecret, refreshToken };
    console.error("[config] Google OAuth2 credentials loaded");
  } else {
    console.error("[config] Google OAuth2 not configured (missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN)");
  }

  // GA4 (property ID is optional — can be passed per-request via ga4_list_accounts)
  const ga4PropertyId = process.env.GA4_PROPERTY_ID;
  if (ga4PropertyId) {
    config.ga4 = { propertyId: ga4PropertyId };
    console.error(`[config] GA4 default property: ${ga4PropertyId}`);
  } else {
    console.error("[config] GA4_PROPERTY_ID not set — use ga4_list_accounts to pick a property at runtime");
  }

  // GSC (site URL is optional — can be passed per-request via gsc_list_sites)
  const gscSiteUrl = process.env.GSC_SITE_URL;
  if (gscSiteUrl) {
    config.gsc = { siteUrl: gscSiteUrl };
    console.error(`[config] GSC default site: ${gscSiteUrl}`);
  } else {
    console.error("[config] GSC_SITE_URL not set — use gsc_list_sites to pick a site at runtime");
  }

  // Meta Ads
  const metaAccessToken = process.env.META_ACCESS_TOKEN;
  if (metaAccessToken) {
    config.meta = {
      accessToken: metaAccessToken,
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
    };
    console.error("[config] Meta Ads configured");
  } else {
    console.error("[config] Meta Ads not configured (missing META_ACCESS_TOKEN)");
  }

  // Google Ads
  const gadsDevToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const gadsCustomerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (gadsDevToken && gadsCustomerId && config.google) {
    config.googleAds = {
      developerToken: gadsDevToken,
      customerAccountId: gadsCustomerId,
      loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    };
    console.error(`[config] Google Ads configured (customer: ${gadsCustomerId})`);
  } else if ((gadsDevToken || gadsCustomerId) && !config.google) {
    console.error("[config] Google Ads env vars set but Google OAuth2 missing — Google Ads tools disabled");
  } else {
    console.error("[config] Google Ads not configured (missing GOOGLE_ADS_DEVELOPER_TOKEN or GOOGLE_ADS_CUSTOMER_ID)");
  }

  return config;
}
