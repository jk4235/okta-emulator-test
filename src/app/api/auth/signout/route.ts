import { NextResponse } from "next/server";
import {
  getLogoutUrl,
  getPostLogoutRedirectUrl,
} from "@/lib/okta";
import { clearSession, getSession, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  await clearSession();

  const redirectUrl =
    session?.idToken != null
      ? (() => {
          const url = new URL(getLogoutUrl(session.scenario.authServer));
          url.searchParams.set("client_id", session.oauth.clientId);
          url.searchParams.set(
            "post_logout_redirect_uri",
            getPostLogoutRedirectUrl(),
          );
          url.searchParams.set("id_token_hint", session.idToken);
          return url;
        })()
      : new URL("/", request.url);

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
