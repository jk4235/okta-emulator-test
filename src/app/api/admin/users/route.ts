import { NextResponse } from "next/server";
import { getManagementUrl, OKTA_MANAGEMENT_TOKEN } from "@/lib/okta";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const targetUrl = new URL(getManagementUrl("/api/v1/users"));
  targetUrl.search = requestUrl.search;

  const response = await fetch(targetUrl, {
    headers: {
      Authorization: `SSWS ${OKTA_MANAGEMENT_TOKEN}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = (await response.json()) as unknown;
  return NextResponse.json(data, { status: response.status });
}
