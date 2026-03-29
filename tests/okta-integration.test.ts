import { createEmulator, type EmulatorOptions } from "emulate";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildPkceChallenge } from "../src/lib/okta";

const port = 14007;
const baseUrl = `http://localhost:${port}`;
const redirectUri = "http://localhost:3000/api/auth/callback";
const clientId = "okta-test-app";
const clientSecret = "test-secret-123";
const codeVerifier = "verifier-for-okta-integration-tests";
const codeChallenge = buildPkceChallenge(codeVerifier);

const seed: EmulatorOptions["seed"] = {
  okta: {
    users: [
      {
        okta_id: "00u_alice",
        login: "alice@example.com",
        email: "alice@example.com",
        first_name: "Alice",
        last_name: "Johnson",
      },
      {
        okta_id: "00u_bob",
        login: "bob@example.com",
        email: "bob@example.com",
        first_name: "Bob",
        last_name: "Smith",
      },
    ],
    groups: [
      {
        okta_id: "00g_admins",
        name: "Admins",
        description: "Administrative users",
      },
      {
        okta_id: "00g_engineers",
        name: "Engineers",
        description: "Engineering team",
      },
    ],
    authorization_servers: [
      {
        id: "default",
        name: "default",
        audiences: ["api://default"],
      },
    ],
    oauth_clients: [
      {
        client_id: clientId,
        client_secret: clientSecret,
        name: "Okta Emulator Test App",
        redirect_uris: [redirectUri, "http://localhost:3000/"],
        auth_server_id: "default",
      },
    ],
    group_memberships: [
      { user_okta_id: "00u_alice", group_okta_id: "00g_everyone" },
      { user_okta_id: "00u_alice", group_okta_id: "00g_admins" },
      { user_okta_id: "00u_bob", group_okta_id: "00g_everyone" },
      { user_okta_id: "00u_bob", group_okta_id: "00g_engineers" },
    ],
  },
};

let emulator: Awaited<ReturnType<typeof createEmulator>>;

type TokenPayload = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

function formHeaders() {
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
}

function managementHeaders(token = "test_token_admin") {
  return {
    Authorization: `SSWS ${token}`,
    Accept: "application/json",
  };
}

async function requestAuthorizationCode(options?: {
  userRef?: string;
  responseMode?: "query" | "form_post";
  scope?: string;
  state?: string;
  challenge?: string;
  challengeMethod?: "S256" | "plain";
}) {
  const responseMode = options?.responseMode ?? "query";
  const state = options?.state ?? "integration-state";
  const response = await fetch(`${baseUrl}/oauth2/default/v1/authorize/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      user_ref: options?.userRef ?? "alice@example.com",
      redirect_uri: redirectUri,
      scope: options?.scope ?? "openid profile email groups offline_access",
      state,
      client_id: clientId,
      response_mode: responseMode,
      auth_server_id: "default",
      code_challenge: options?.challenge ?? codeChallenge,
      code_challenge_method: options?.challengeMethod ?? "S256",
    }),
    redirect: "manual",
  });

  return { response, state };
}

async function exchangeCode(
  code: string,
  options?: {
    redirectUri?: string;
    verifier?: string;
    clientId?: string;
    clientSecret?: string;
  },
) {
  const response = await fetch(`${baseUrl}/oauth2/default/v1/token`, {
    method: "POST",
    headers: formHeaders(),
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: options?.redirectUri ?? redirectUri,
      client_id: options?.clientId ?? clientId,
      client_secret: options?.clientSecret ?? clientSecret,
      code_verifier: options?.verifier ?? codeVerifier,
    }),
  });

  const data = (await response.json()) as TokenPayload;
  return { response, data };
}

async function createAuthorizationTokens() {
  const authorize = await requestAuthorizationCode();
  expect(authorize.response.status).toBe(302);
  const location = authorize.response.headers.get("location");
  const code = new URL(location ?? redirectUri).searchParams.get("code");
  expect(code).toBeTruthy();
  return exchangeCode(code ?? "");
}

beforeAll(async () => {
  emulator = await createEmulator({ service: "okta", port, seed });
});

afterAll(async () => {
  await emulator.close();
});

describe("Okta emulator integration", () => {
  it("serves discovery and JWKS endpoints", async () => {
    const discoveryRes = await fetch(
      `${baseUrl}/oauth2/default/.well-known/openid-configuration`,
    );
    expect(discoveryRes.ok).toBe(true);
    const discovery = (await discoveryRes.json()) as Record<string, unknown>;

    expect(discovery.issuer).toBe(`${baseUrl}/oauth2/default`);
    expect(discovery.authorization_endpoint).toBe(
      `${baseUrl}/oauth2/default/v1/authorize`,
    );
    expect(discovery.token_endpoint).toBe(`${baseUrl}/oauth2/default/v1/token`);

    const jwksRes = await fetch(`${baseUrl}/oauth2/default/v1/keys`);
    expect(jwksRes.ok).toBe(true);
    const jwks = (await jwksRes.json()) as { keys: Array<{ kid: string }> };
    expect(jwks.keys[0]?.kid).toBe("emulate-okta-1");
  });

  it("renders the authorize page with seeded users", async () => {
    const authorizeRes = await fetch(
      `${baseUrl}/oauth2/default/v1/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=state-1&response_type=code`,
    );

    expect(authorizeRes.ok).toBe(true);
    const html = await authorizeRes.text();
    expect(html).toContain("Sign in with Okta");
    expect(html).toContain("alice@example.com");
    expect(html).toContain("bob@example.com");
    expect(html).toContain("testuser@okta.local");
  });

  it("supports form_post authorize responses", async () => {
    const { response, state } = await requestAuthorizationCode({
      responseMode: "form_post",
      state: "form-post-state",
    });

    expect(response.ok).toBe(true);
    const html = await response.text();
    expect(html).toContain("<form method=\"POST\"");
    expect(html).toContain(`name="state" value="${state}"`);
    expect(html).toContain('name="code" value="');
  });

  it("completes the authorization code flow with PKCE, refresh, introspect, and revoke", async () => {
    const tokenResult = await createAuthorizationTokens();
    expect(tokenResult.response.ok).toBe(true);
    expect(tokenResult.data.access_token).toBeTruthy();
    expect(tokenResult.data.refresh_token).toBeTruthy();
    expect(tokenResult.data.id_token).toBeTruthy();

    const userinfoRes = await fetch(`${baseUrl}/oauth2/default/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenResult.data.access_token}`,
      },
    });
    expect(userinfoRes.ok).toBe(true);
    const userinfo = (await userinfoRes.json()) as {
      email?: string;
      groups?: string[];
      preferred_username?: string;
    };

    expect(userinfo.email).toBe("alice@example.com");
    expect(userinfo.preferred_username).toBe("alice@example.com");
    expect(userinfo.groups).toContain("Admins");
    expect(userinfo.groups).toContain("Everyone");

    const introspectRes = await fetch(`${baseUrl}/oauth2/default/v1/introspect`, {
      method: "POST",
      headers: formHeaders(),
      body: new URLSearchParams({
        token: tokenResult.data.access_token ?? "",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    expect(introspectRes.ok).toBe(true);
    const introspectData = (await introspectRes.json()) as {
      active?: boolean;
      username?: string;
    };
    expect(introspectData.active).toBe(true);
    expect(introspectData.username).toBe("alice@example.com");

    const refreshRes = await fetch(`${baseUrl}/oauth2/default/v1/token`, {
      method: "POST",
      headers: formHeaders(),
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenResult.data.refresh_token ?? "",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    expect(refreshRes.ok).toBe(true);
    const refreshData = (await refreshRes.json()) as TokenPayload;
    expect(refreshData.access_token).toBeTruthy();
    expect(refreshData.refresh_token).toBeTruthy();
    expect(refreshData.id_token).toBeTruthy();
    expect(refreshData.access_token).not.toBe(tokenResult.data.access_token);
    expect(refreshData.refresh_token).not.toBe(tokenResult.data.refresh_token);

    const refreshIntrospectRes = await fetch(
      `${baseUrl}/oauth2/default/v1/introspect`,
      {
        method: "POST",
        headers: formHeaders(),
        body: new URLSearchParams({
          token: refreshData.refresh_token ?? "",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );
    expect(refreshIntrospectRes.ok).toBe(true);
    const refreshIntrospect = (await refreshIntrospectRes.json()) as {
      active?: boolean;
      token_type?: string;
    };
    expect(refreshIntrospect.active).toBe(true);
    expect(refreshIntrospect.token_type).toBe("refresh_token");

    const revokeRes = await fetch(`${baseUrl}/oauth2/default/v1/revoke`, {
      method: "POST",
      headers: formHeaders(),
      body: new URLSearchParams({
        token: refreshData.access_token ?? "",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    expect(revokeRes.status).toBe(200);

    const revokedUserinfoRes = await fetch(
      `${baseUrl}/oauth2/default/v1/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${refreshData.access_token}`,
        },
      },
    );
    expect(revokedUserinfoRes.status).toBe(401);
  });

  it("rejects invalid PKCE verifiers and invalid client credentials", async () => {
    const authorize = await requestAuthorizationCode();
    const location = authorize.response.headers.get("location");
    const code = new URL(location ?? redirectUri).searchParams.get("code");
    expect(code).toBeTruthy();

    const badPkce = await exchangeCode(code ?? "", {
      verifier: "wrong-verifier",
    });
    expect(badPkce.response.status).toBe(400);
    expect(badPkce.data.error).toBe("invalid_grant");
    expect(badPkce.data.error_description).toContain("PKCE verification failed");

    const clientCredentialsBadSecret = await fetch(
      `${baseUrl}/oauth2/default/v1/token`,
      {
        method: "POST",
        headers: formHeaders(),
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: "wrong-secret",
          scope: "custom.read custom.write",
        }),
      },
    );

    expect(clientCredentialsBadSecret.status).toBe(401);
    const invalidClient = (await clientCredentialsBadSecret.json()) as TokenPayload;
    expect(invalidClient.error).toBe("invalid_client");
  });

  it("supports client_credentials tokens and rejects userinfo for app-only tokens", async () => {
    const tokenRes = await fetch(`${baseUrl}/oauth2/default/v1/token`, {
      method: "POST",
      headers: formHeaders(),
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "custom.read custom.write",
      }),
    });

    expect(tokenRes.ok).toBe(true);
    const body = (await tokenRes.json()) as TokenPayload;
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeUndefined();
    expect(body.scope).toBe("custom.read custom.write");

    const introspectRes = await fetch(`${baseUrl}/oauth2/default/v1/introspect`, {
      method: "POST",
      headers: formHeaders(),
      body: new URLSearchParams({
        token: body.access_token ?? "",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    expect(introspectRes.ok).toBe(true);
    const introspect = (await introspectRes.json()) as {
      active?: boolean;
      client_id?: string;
      username?: string | null;
    };
    expect(introspect.active).toBe(true);
    expect(introspect.client_id).toBe(clientId);
    expect(introspect.username).toBeNull();

    const userinfoRes = await fetch(`${baseUrl}/oauth2/default/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${body.access_token}`,
      },
    });
    expect(userinfoRes.status).toBe(401);
  });

  it("serves the management API with auth, search, filter, users/me, and lifecycle operations", async () => {
    const usersRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: managementHeaders(),
    });

    expect(usersRes.ok).toBe(true);
    const users = (await usersRes.json()) as Array<{
      profile?: { email?: string; login?: string };
    }>;
    expect(users.some((user) => user.profile?.email === "alice@example.com")).toBe(
      true,
    );

    const usersMeRes = await fetch(`${baseUrl}/api/v1/users/me`, {
      headers: managementHeaders(),
    });
    expect(usersMeRes.ok).toBe(true);
    const me = (await usersMeRes.json()) as { profile?: { email?: string } };
    expect(me.profile?.email).toBeTruthy();

    const searchedUsersRes = await fetch(`${baseUrl}/api/v1/users?search=alice`, {
      headers: managementHeaders(),
    });
    expect(searchedUsersRes.ok).toBe(true);
    const searchedUsers = (await searchedUsersRes.json()) as Array<{
      profile?: { login?: string };
    }>;
    expect(
      searchedUsers.some((user) => user.profile?.login === "alice@example.com"),
    ).toBe(true);

    const filteredUsersRes = await fetch(
      `${baseUrl}/api/v1/users?filter=status eq ACTIVE`,
      {
        headers: managementHeaders(),
      },
    );
    expect(filteredUsersRes.ok).toBe(true);
    const filteredUsers = (await filteredUsersRes.json()) as Array<{
      status?: string;
    }>;
    expect(filteredUsers.length).toBeGreaterThan(0);
    expect(filteredUsers.every((user) => user.status === "ACTIVE")).toBe(true);

    const groupsRes = await fetch(`${baseUrl}/api/v1/groups`, {
      headers: managementHeaders(),
    });

    expect(groupsRes.ok).toBe(true);
    const groups = (await groupsRes.json()) as Array<{
      profile?: { name?: string };
    }>;
    expect(groups.some((group) => group.profile?.name === "Admins")).toBe(true);

    const aliceId =
      users.find((user) => user.profile?.email === "alice@example.com")?.id ?? "";
    expect(aliceId).toBeTruthy();

    const suspendRes = await fetch(
      `${baseUrl}/api/v1/users/${aliceId}/lifecycle/suspend`,
      {
        method: "POST",
        headers: managementHeaders(),
      },
    );
    expect(suspendRes.ok).toBe(true);
    const suspendedUser = (await suspendRes.json()) as { status?: string };
    expect(suspendedUser.status).toBe("SUSPENDED");

    const unsuspendRes = await fetch(
      `${baseUrl}/api/v1/users/${aliceId}/lifecycle/unsuspend`,
      {
        method: "POST",
        headers: managementHeaders(),
      },
    );
    expect(unsuspendRes.ok).toBe(true);
    const unsuspendedUser = (await unsuspendRes.json()) as { status?: string };
    expect(unsuspendedUser.status).toBe("ACTIVE");

    const aliceGroupsRes = await fetch(`${baseUrl}/api/v1/users/${aliceId}/groups`, {
      headers: managementHeaders(),
    });
    expect(aliceGroupsRes.ok).toBe(true);
    const aliceGroups = (await aliceGroupsRes.json()) as Array<{
      profile?: { name?: string };
    }>;
    expect(aliceGroups.some((group) => group.profile?.name === "Admins")).toBe(true);
  });

  it("supports group membership changes and rejects missing management auth", async () => {
    const usersRes = await fetch(`${baseUrl}/api/v1/users`, {
      headers: managementHeaders(),
    });
    const users = (await usersRes.json()) as Array<{
      id?: string;
      profile?: { email?: string };
    }>;
    const bobId = users.find((user) => user.profile?.email === "bob@example.com")?.id;
    expect(bobId).toBeTruthy();

    const groupsRes = await fetch(`${baseUrl}/api/v1/groups`, {
      headers: managementHeaders(),
    });
    const groups = (await groupsRes.json()) as Array<{
      id?: string;
      profile?: { name?: string };
    }>;
    const adminsId = groups.find((group) => group.profile?.name === "Admins")?.id;
    expect(adminsId).toBeTruthy();

    const addMembershipRes = await fetch(
      `${baseUrl}/api/v1/groups/${adminsId}/users/${bobId}`,
      {
        method: "PUT",
        headers: managementHeaders(),
      },
    );
    expect(addMembershipRes.status).toBe(204);

    const groupUsersRes = await fetch(`${baseUrl}/api/v1/groups/${adminsId}/users`, {
      headers: managementHeaders(),
    });
    expect(groupUsersRes.ok).toBe(true);
    const groupUsers = (await groupUsersRes.json()) as Array<{
      profile?: { email?: string };
    }>;
    expect(groupUsers.some((user) => user.profile?.email === "bob@example.com")).toBe(
      true,
    );

    const removeMembershipRes = await fetch(
      `${baseUrl}/api/v1/groups/${adminsId}/users/${bobId}`,
      {
        method: "DELETE",
        headers: managementHeaders(),
      },
    );
    expect(removeMembershipRes.status).toBe(204);

    const unauthenticatedUsersRes = await fetch(`${baseUrl}/api/v1/users`);
    expect(unauthenticatedUsersRes.status).toBe(401);
  });

  it("supports the logout endpoint", async () => {
    const logoutRes = await fetch(`${baseUrl}/oauth2/default/v1/logout?client_id=${clientId}&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F`, {
      redirect: "manual",
    });

    expect(logoutRes.status).toBe(302);
    expect(logoutRes.headers.get("location")).toBe("http://localhost:3000/");
  });
});
