import bizSdk from "facebook-nodejs-business-sdk";
import type { MetaConfig } from "../types/index.js";

let initialized = false;

export function initMetaApi(config: MetaConfig): void {
  if (!initialized) {
    bizSdk.FacebookAdsApi.init(config.accessToken);
    if (config.appSecret) {
      bizSdk.FacebookAdsApi.init(config.accessToken).setAppSecret(config.appSecret);
    }
    initialized = true;
    console.error("[meta-auth] Meta Ads API initialized");
  }
}

export function getMetaAdAccount(accountId: string) {
  return new bizSdk.AdAccount(accountId);
}

export function getMetaUser() {
  return new bizSdk.User("me");
}
