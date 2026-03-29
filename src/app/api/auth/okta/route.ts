import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildPkceChallenge,
  getAuthorizeUrl,
  getCallbackUrl,
  getInvalidRedirectUrl,
} from "@/lib/okta";
import {
  getOktaScenario,
  isSuccessScenario,
} from "@/lib/okta-scenarios";
import { createOauthState } from "@/lib/session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const scenarioId = requestUrl.searchParams.get("scenario") ?? "default-query-pkce";
  const scenario = getOktaScenario(scenarioId);

  if (!scenario) {
    return NextResponse.json({ error: `Unknown scenario: ${scenarioId}` }, { status: 404 });
  }

  const state = crypto.randomUUID();
  const verifier = randomBytes(32).toString("base64url");
  const challenge = buildPkceChallenge(verifier);

  if (isSuccessScenario(scenario)) {
    await createOauthState(state, verifier, scenario.id);
  }

  const url = new URL(getAuthorizeUrl(scenario.authServer));
  url.searchParams.set("client_id", scenario.clientId);
  url.searchParams.set(
    "redirect_uri",
    scenario.redirectVariant === "invalid"
      ? getInvalidRedirectUrl()
      : getCallbackUrl(),
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scenario.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("response_mode", scenario.responseMode);

  if (scenario.usesPkce) {
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  return NextResponse.redirect(url);
}
