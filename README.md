# Okta Emulator Test Project

This project is a real Next.js app used as a browser scenario lab for the local Okta emulator in `~/Desktop/SourceCode/emulate`.

## What It Covers

- Default authorization server with query callback + PKCE
- Default authorization server with `form_post`
- Org authorization server login flow
- Official `@okta/okta-auth-js` redirect + PKCE flow
- Public client / PKCE-only compatibility against the local Okta emulator
- Group claim visibility through the `groups` scope
- Invalid `client_id` authorize failure page
- Invalid `redirect_uri` authorize failure page
- Browser-level sign-in, result pages, dashboard, admin, and sign-out flows
- Management API browsing after a successful login

## Local Setup

Build the emulator package first:

```bash
cd ~/Desktop/SourceCode/emulate
pnpm build
```

Install dependencies for this test project:

```bash
cd ~/Desktop/SourceCode/okta-emulator-test
pnpm install
```

## Run The Real App

Start the Okta emulator:

```bash
npx emulate --service okta --port 4007 --seed emulate.config.yaml
```

Start the app:

```bash
pnpm start
```

Open [http://localhost:3000](http://localhost:3000), sign in with one of the seeded users, then visit `/dashboard` and `/admin`.

The home page is the scenario gallery. Each card opens a different real browser flow through the emulator.

## Browser Scenario Checklist

## Official SDK Check

There is also a dedicated official SDK page at `/official-sdk`.

It uses `@okta/okta-auth-js` directly in the browser to validate the emulator's public-client compatibility:

- `signInWithRedirect()`
- PKCE redirect login
- `token_endpoint_auth_method: "none"`
- token exchange without `client_secret`
- callback parsing with the official SDK
- token manager storage
- reading user claims from the SDK
- SDK-triggered logout

The official SDK route is intended to prove that the emulator now supports the same browser-side redirect + PKCE flow that a real Okta public client uses.

Manual flow:

1. Open `http://localhost:3000/official-sdk`
2. Click `Sign in with official SDK`
3. On the emulator page, select a seeded user
4. Confirm the browser returns to `/official-sdk/callback`
5. Confirm it redirects back to `/official-sdk`
6. Confirm tokens and user info are visible on the page
7. Click `Sign out with official SDK`
8. Confirm the browser returns to `/official-sdk`
9. Confirm the page shows `isAuthenticated: false` and cleared token state after logout

### Common Troubleshooting

If the callback page shows `The token signature is not valid`, clear site data or open a fresh private window and try again.

This usually happens after restarting the local emulator while the browser still has cached Okta SDK metadata or tokens from a previous session.

### 1. Default AS Query + PKCE

- Open the `Default AS Query + PKCE` card on the home page.
- Confirm the emulator page lists `testuser@okta.local`, `alice@example.com`, and `bob@example.com`.
- Choose any user.
- Confirm the app returns to `/scenarios/default-query-pkce`.
- Confirm the result page shows callback method `GET`.
- Confirm signing out returns to `/`.

### 2. Default AS Form Post

- Open the `Default AS Form Post` card.
- Choose any user on the emulator page.
- Confirm the app returns to `/scenarios/default-form-post`.
- Confirm the result page shows callback method `POST`.
- Confirm signing out still returns to `/`.

### 3. Org Authorization Server

- Open the `Org Authorization Server` card.
- Choose any user on the emulator page.
- Confirm the result page is `/scenarios/org-query-pkce`.
- Confirm the page shows the org issuer and org OAuth endpoints in the stored session data.

### 4. Groups Scope Claims

- Open the `Groups Scope Claims` card.
- Choose `alice@example.com` or `bob@example.com`.
- Confirm the result page is `/scenarios/groups-claims`.
- Confirm `groups` are present in the user data and live `/userinfo` response.
- For Alice, expect `Everyone` and `Admins`.
- For Bob, expect `Everyone` and `Engineers`.

### 5. Invalid Client Error

- Open the `Invalid Client Error` card.
- Confirm the emulator stops on its own HTML error page.
- Expected title: `Application not found`.
- Confirm the app does not receive a callback.

### 6. Invalid Redirect URI Error

- Open the `Invalid Redirect URI Error` card.
- Confirm the emulator stops on its own HTML error page.
- Expected title: `Redirect URI mismatch`.
- Confirm the app does not receive a callback.

## Run Automated Verification

```bash
pnpm lint
pnpm test
pnpm build
```

The integration tests use a separate emulator port so they can run without conflicting with the live demo app.

## Seeded Data

The main seeded users are:

- `alice@example.com`
- `bob@example.com`
- the emulator default user `testuser@okta.local`

The project also seeds:

- `Admins`
- `Engineers`
- the emulator default `Everyone` group

It also seeds a second OAuth client for the Org authorization server:

- `okta-test-app` for `default`
- `okta-org-test-app` for `org`

The default authorization server client is also used by the `/official-sdk` page as a public PKCE client.
