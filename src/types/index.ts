export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface GA4Config {
  propertyId: string;
}

export interface GSCConfig {
  siteUrl: string;
}

export interface MetaConfig {
  accessToken: string;
  appId?: string;
  appSecret?: string;
}

export interface GoogleAdsConfig {
  developerToken: string;
  customerAccountId: string;
  loginCustomerId?: string;
}

export interface AppConfig {
  google?: GoogleAuthConfig;
  ga4?: GA4Config;
  gsc?: GSCConfig;
  meta?: MetaConfig;
  googleAds?: GoogleAdsConfig;
}

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}
