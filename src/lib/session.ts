import { cookies } from "next/headers";
import type { OktaAuthServerId, OktaScenarioId } from "./okta-scenarios";

export const SESSION_COOKIE = "okta-emulator-session";
export const STATE_COOKIE = "okta-oauth-state";
export const PKCE_COOKIE = "okta-pkce-verifier";
export const SCENARIO_COOKIE = "okta-oauth-scenario";

export type Session = {
  provider: "okta";
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  scenario: {
    id: OktaScenarioId;
    title: string;
    authServer: OktaAuthServerId;
    responseMode: "query" | "form_post";
    scope: string;
    callbackMethod: "GET" | "POST";
    expectsGroups: boolean;
  };
  oauth: {
    clientId: string;
    issuer: string;
    authorizeUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    logoutUrl: string;
  };
  user: {
    sub?: string;
    name: string;
    email: string;
    preferredUsername?: string;
    groups?: string[];
  };
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeSession(raw: string): Session | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  return raw ? decodeSession(raw) : null;
}

export async function createOauthState(
  state: string,
  verifier: string,
  scenarioId: OktaScenarioId,
) {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  cookieStore.set(PKCE_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  cookieStore.set(SCENARIO_COOKIE, scenarioId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function consumeOauthState() {
  const cookieStore = await cookies();
  const state = cookieStore.get(STATE_COOKIE)?.value ?? null;
  const verifier = cookieStore.get(PKCE_COOKIE)?.value ?? null;
  const scenarioId = cookieStore.get(SCENARIO_COOKIE)?.value ?? null;
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(PKCE_COOKIE);
  cookieStore.delete(SCENARIO_COOKIE);
  return { state, verifier, scenarioId };
}

export async function persistSession(session: Session) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
