import { NextResponse } from "next/server";
import {
  getCallbackUrl,
  getIssuerUrl,
  getTokenUrl,
  getUserInfoUrl,
} from "@/lib/okta";
import { getOktaScenario, isSuccessScenario } from "@/lib/okta-scenarios";
import { consumeOauthState, persistSession, type Session } from "@/lib/session";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type UserInfoResponse = {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  groups?: string[];
};

async function readCallbackParams(request: Request) {
  if (request.method === "POST") {
    const formData = await request.formData();
    return {
      code: formData.get("code")?.toString() ?? null,
      state: formData.get("state")?.toString() ?? null,
      error: formData.get("error")?.toString() ?? null,
    };
  }

  const url = new URL(request.url);
  return {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
  };
}

async function handleCallback(request: Request) {
  const { code, state, error } = await readCallbackParams(request);

  if (error) {
    return new Response(`OAuth error: ${error}`, { status: 400 });
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  const stored = await consumeOauthState();
  if (!stored.state || state !== stored.state || !stored.verifier || !stored.scenarioId) {
    return new Response("OAuth state validation failed", { status: 400 });
  }

  const scenario = getOktaScenario(stored.scenarioId);
  if (!scenario || !isSuccessScenario(scenario)) {
    return new Response("OAuth scenario could not be resolved", { status: 400 });
  }

  const tokenUrl = getTokenUrl(scenario.authServer);
  const userInfoUrl = getUserInfoUrl(scenario.authServer);
  const authorizeUrl = `${getIssuerUrl(scenario.authServer)}${
    scenario.authServer === "org" ? "/oauth2/v1/authorize" : `/oauth2/${scenario.authServer}/v1/authorize`
  }`;
  const logoutUrl = `${getIssuerUrl(scenario.authServer)}${
    scenario.authServer === "org" ? "/oauth2/v1/logout" : `/oauth2/${scenario.authServer}/v1/logout`
  }`;

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getCallbackUrl(),
      client_id: scenario.clientId,
      client_secret: scenario.clientSecret,
      code_verifier: stored.verifier,
    }),
    cache: "no-store",
  });

  const tokenData = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    return new Response(
      `Token exchange failed: ${JSON.stringify(tokenData, null, 2)}`,
      { status: 502 },
    );
  }

  const userRes = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    cache: "no-store",
  });
  const userData = (await userRes.json()) as UserInfoResponse;

  if (!userRes.ok) {
    return new Response(
      `Userinfo request failed: ${JSON.stringify(userData, null, 2)}`,
      { status: 502 },
    );
  }

  const session: Session = {
    provider: "okta",
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    idToken: tokenData.id_token,
    scenario: {
      id: scenario.id,
      title: scenario.title,
      authServer: scenario.authServer,
      responseMode: scenario.responseMode,
      scope: scenario.scope,
      callbackMethod: request.method === "POST" ? "POST" : "GET",
      expectsGroups: scenario.expectsGroups,
    },
    oauth: {
      clientId: scenario.clientId,
      issuer: getIssuerUrl(scenario.authServer),
      authorizeUrl,
      tokenUrl,
      userInfoUrl,
      logoutUrl,
    },
    user: {
      sub: userData.sub,
      name: userData.name ?? "Unknown User",
      email: userData.email ?? "",
      preferredUsername: userData.preferred_username,
      groups: userData.groups ?? [],
    },
  };

  await persistSession(session);

  return NextResponse.redirect(new URL(`/scenarios/${scenario.id}`, request.url));
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}
