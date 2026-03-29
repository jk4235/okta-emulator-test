"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOfficialOktaAuth,
  loadOfficialSdkState,
  OFFICIAL_SDK_CLIENT_ID,
  OFFICIAL_SDK_ISSUER,
  OFFICIAL_SDK_POST_LOGOUT_REDIRECT_URI,
  OFFICIAL_SDK_REDIRECT_URI,
  OFFICIAL_SDK_SCOPES,
  type OfficialSdkState,
} from "@/lib/official-okta-sdk";

const initialState: OfficialSdkState = {
  isAuthenticated: false,
  tokens: null,
  userInfo: null,
  error: null,
};

export function OfficialSdkPanel() {
  const [state, setState] = useState<OfficialSdkState>(initialState);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    setLoading(true);
    const nextState = await loadOfficialSdkState();
    setState(nextState);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    void loadOfficialSdkState().then((nextState) => {
      if (!active) return;
      setState(nextState);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = async () => {
    setActionError(null);
    try {
      const authClient = getOfficialOktaAuth();
      await authClient.signInWithRedirect({
        originalUri: "/official-sdk",
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unknown sign-in error");
    }
  };

  const handleSignOut = async () => {
    setActionError(null);
    try {
      const authClient = getOfficialOktaAuth();
      await authClient.signOut({
        clearTokensBeforeRedirect: true,
        postLogoutRedirectUri: OFFICIAL_SDK_POST_LOGOUT_REDIRECT_URI,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unknown sign-out error");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-panel-border bg-panel p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">Official Okta SDK</p>
          <h1 className="text-3xl font-semibold">
            Validate the emulator with `@okta/okta-auth-js`
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            This page uses the official browser SDK instead of the app&apos;s
            handwritten OAuth flow. If this works, the emulator is compatible
            with the standard Okta Auth JS redirect + PKCE login path.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSignIn}
            className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Sign in with official SDK
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
          >
            Sign out with official SDK
          </button>
          <button
            type="button"
            onClick={() => void refreshState()}
            className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
          >
            Refresh state
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-panel-border bg-background/50 p-4 text-sm text-muted">
          Use this page to verify `signInWithRedirect()`, callback parsing,
          token manager storage, user claims, and logout against the local Okta
          emulator.
        </div>

        {actionError ? (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6 text-red-400">
            {actionError}
          </pre>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">SDK configuration</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
            {JSON.stringify(
              {
                issuer: OFFICIAL_SDK_ISSUER,
                clientId: OFFICIAL_SDK_CLIENT_ID,
                redirectUri: OFFICIAL_SDK_REDIRECT_URI,
                postLogoutRedirectUri: OFFICIAL_SDK_POST_LOGOUT_REDIRECT_URI,
                scopes: OFFICIAL_SDK_SCOPES,
                pkce: true,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">Auth state</h2>
          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading SDK auth state...</p>
          ) : (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
              {JSON.stringify(
                {
                  isAuthenticated: state.isAuthenticated,
                  error: state.error,
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">Stored tokens</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
            {loading
              ? "Loading..."
              : JSON.stringify(state.tokens ?? {}, null, 2)}
          </pre>
        </div>

        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">User info from SDK</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
            {loading
              ? "Loading..."
              : JSON.stringify(state.userInfo ?? {}, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
