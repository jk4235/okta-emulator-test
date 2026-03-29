"use client";

import { useEffect, useState } from "react";

type UserInfoState = {
  data: unknown;
  error: string | null;
};

export function UserInfoPanel() {
  const [state, setState] = useState<UserInfoState>({
    data: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await fetch("/api/auth/userinfo", { cache: "no-store" });
        const data = (await response.json()) as unknown;

        if (!isMounted) return;
        if (!response.ok) {
          setState({
            data: null,
            error: JSON.stringify(data, null, 2),
          });
          return;
        }

        setState({ data, error: null });
      } catch (error) {
        if (!isMounted) return;
        setState({
          data: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-panel-border bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Live `/userinfo` response</h2>
          <p className="mt-1 text-sm text-muted">
            Fetched from the Okta emulator using the stored access token.
          </p>
        </div>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6 text-foreground">
        {state.error
          ? state.error
          : state.data
            ? JSON.stringify(state.data, null, 2)
            : "Loading..."}
      </pre>
    </section>
  );
}
