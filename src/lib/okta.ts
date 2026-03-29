import { createHash } from "node:crypto";
import type { OktaAuthServerId } from "./okta-scenarios";

const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_EMULATOR_URL = "http://localhost:4007";
const DEFAULT_AUTH_SERVER_ID = "default";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
export const OKTA_BASE_URL = process.env.OKTA_EMULATOR_URL ?? DEFAULT_EMULATOR_URL;
export const OKTA_AUTH_SERVER_ID = (process.env.OKTA_AUTH_SERVER_ID ??
  DEFAULT_AUTH_SERVER_ID) as OktaAuthServerId;
export const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID ?? "okta-test-app";
export const OKTA_CLIENT_SECRET =
  process.env.OKTA_CLIENT_SECRET ?? "test-secret-123";
export const OKTA_MANAGEMENT_TOKEN =
  process.env.OKTA_MANAGEMENT_TOKEN ?? "test_token_admin";

export const OKTA_SCOPES = "openid profile email groups offline_access";

export function getOktaOauthBaseUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  if (authServerId === "org") {
    return `${OKTA_BASE_URL}/oauth2/v1`;
  }
  return `${OKTA_BASE_URL}/oauth2/${authServerId}/v1`;
}

export function getAuthorizeUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  return `${getOktaOauthBaseUrl(authServerId)}/authorize`;
}

export function getTokenUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  return `${getOktaOauthBaseUrl(authServerId)}/token`;
}

export function getUserInfoUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  return `${getOktaOauthBaseUrl(authServerId)}/userinfo`;
}

export function getIntrospectUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  return `${getOktaOauthBaseUrl(authServerId)}/introspect`;
}

export function getRevokeUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  return `${getOktaOauthBaseUrl(authServerId)}/revoke`;
}

export function getLogoutUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  return `${getOktaOauthBaseUrl(authServerId)}/logout`;
}

export function getManagementUrl(path: string): string {
  return `${OKTA_BASE_URL}${path}`;
}

export function getCallbackUrl(): string {
  return `${APP_URL}/api/auth/callback`;
}

export function getPostLogoutRedirectUrl(): string {
  return `${APP_URL}/`;
}

export function getIssuerUrl(
  authServerId: OktaAuthServerId = OKTA_AUTH_SERVER_ID,
): string {
  if (authServerId === "org") {
    return OKTA_BASE_URL;
  }
  return `${OKTA_BASE_URL}/oauth2/${authServerId}`;
}

export function getInvalidRedirectUrl(): string {
  return `${APP_URL}/api/auth/unregistered-callback`;
}

export function buildPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
