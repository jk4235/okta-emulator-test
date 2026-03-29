"use client";

import { useEffect, useState } from "react";

type AdminState = {
  users: unknown;
  groups: unknown;
  error: string | null;
};

export function AdminData() {
  const [state, setState] = useState<AdminState>({
    users: null,
    groups: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          fetch("/api/admin/users", { cache: "no-store" }),
          fetch("/api/admin/groups", { cache: "no-store" }),
        ]);

        const [users, groups] = await Promise.all([
          usersRes.json(),
          groupsRes.json(),
        ]);

        if (!isMounted) return;

        if (!usersRes.ok || !groupsRes.ok) {
          setState({
            users: null,
            groups: null,
            error: JSON.stringify({ users, groups }, null, 2),
          });
          return;
        }

        setState({ users, groups, error: null });
      } catch (error) {
        if (!isMounted) return;
        setState({
          users: null,
          groups: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (state.error) {
    return (
      <pre className="rounded-xl bg-background/70 p-4 text-xs leading-6">
        {state.error}
      </pre>
    );
  }

  if (state.users == null || state.groups == null) {
    return <p className="text-sm text-muted">Loading management API data...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-panel-border bg-panel p-5">
        <h2 className="text-lg font-semibold">`/api/v1/users`</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
          {JSON.stringify(state.users, null, 2)}
        </pre>
      </section>

      <section className="rounded-2xl border border-panel-border bg-panel p-5">
        <h2 className="text-lg font-semibold">`/api/v1/groups`</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
          {JSON.stringify(state.groups, null, 2)}
        </pre>
      </section>
    </div>
  );
}
