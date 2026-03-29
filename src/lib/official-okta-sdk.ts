"use client";

import { OktaAuth, type Tokens } from "@okta/okta-auth-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const OKTA_BASE_URL =
  process.env.NEXT_PUBLIC_OKTA_EMULATOR_URL ?? "http://localhost:4007";

export const OFFICIAL_SDK_CLIENT_ID =
  process.env.NEXT_PUBLIC_OKTA_SDK_CLIENT_ID ?? "okta-test-app";
export const OFFICIAL_SDK_ISSUER =
  process.env.NEXT_PUBLIC_OKTA_SDK_ISSUER ??
  `${OKTA_BASE_URL}/oauth2/default`;
export const OFFICIAL_SDK_REDIRECT_URI = `${APP_URL}/official-sdk/callback`;
export const OFFICIAL_SDK_POST_LOGOUT_REDIRECT_URI = `${APP_URL}/official-sdk`;
export const OFFICIAL_SDK_SCOPES = ["openid", "profile", "email", "groups"];

let client: OktaAuth | undefined;

export function getOfficialOktaAuth(): OktaAuth {
  if (!client) {
    client = new OktaAuth({
      issuer: OFFICIAL_SDK_ISSUER,
      clientId: OFFICIAL_SDK_CLIENT_ID,
      redirectUri: OFFICIAL_SDK_REDIRECT_URI,
      scopes: OFFICIAL_SDK_SCOPES,
      pkce: true,
      tokenManager: {
        storage: "sessionStorage",
      },
      storageManager: {
        token: {
          storageType: "sessionStorage",
        },
        cache: {
          storageType: "sessionStorage",
        },
        transaction: {
          storageType: "sessionStorage",
        },
      },
    });
  }

  return client;
}

export type OfficialSdkState = {
  isAuthenticated: boolean;
  tokens: Tokens | null;
  userInfo: Record<string, unknown> | null;
  error: string | null;
};

export async function loadOfficialSdkState(): Promise<OfficialSdkState> {
  const authClient = getOfficialOktaAuth();
  const isAuthenticated = await authClient.isAuthenticated();
  const tokens = authClient.tokenManager.getTokensSync();

  if (!isAuthenticated) {
    return {
      isAuthenticated: false,
      tokens,
      userInfo: null,
      error: null,
    };
  }

  try {
    const userInfo = (await authClient.token.getUserInfo()) as Record<
      string,
      unknown
    >;

    return {
      isAuthenticated: true,
      tokens,
      userInfo,
      error: null,
    };
  } catch (error) {
    return {
      isAuthenticated: true,
      tokens,
      userInfo: null,
      error: error instanceof Error ? error.message : "Unknown SDK error",
    };
  }
}
