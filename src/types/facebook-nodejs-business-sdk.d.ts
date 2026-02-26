declare module "facebook-nodejs-business-sdk" {
  export class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
    setAppSecret(secret: string): void;
  }

  export class User {
    constructor(id: string);
    getAdAccounts(fields: string[], params?: Record<string, any>): Promise<any[]>;
  }

  export class AdAccount {
    constructor(id: string);
    getInsights(fields: string[], params?: Record<string, any>): Promise<any[]>;
    getCampaigns(fields: string[], params?: Record<string, any>): Promise<any[]>;
  }

  export class Campaign {
    constructor(id: string);
    getInsights(fields: string[], params?: Record<string, any>): Promise<any[]>;
  }

  const _default: {
    FacebookAdsApi: typeof FacebookAdsApi;
    User: typeof User;
    AdAccount: typeof AdAccount;
    Campaign: typeof Campaign;
  };
  export default _default;
}
