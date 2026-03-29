import { NextResponse } from "next/server";
import { getUserInfoUrl } from "@/lib/okta";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const response = await fetch(getUserInfoUrl(session.scenario.authServer), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as unknown;
  return NextResponse.json(data, { status: response.status });
}
