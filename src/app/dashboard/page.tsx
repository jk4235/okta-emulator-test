import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UserInfoPanel } from "./userinfo-panel";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-panel-border bg-panel p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted">Signed in with Okta</p>
              <h1 className="mt-2 text-3xl font-semibold">{session.user.name}</h1>
              <p className="mt-2 text-sm text-muted">{session.user.email}</p>
              <p className="text-sm text-muted">
                Scenario: {session.scenario.title}
              </p>
              {session.user.preferredUsername ? (
                <p className="text-sm text-muted">
                  Username: {session.user.preferredUsername}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {(session.user.groups ?? []).map((group) => (
                <span
                  key={group}
                  className="rounded-full border border-panel-border px-3 py-1 text-sm text-muted"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/scenarios/${session.scenario.id}`}
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Scenario Result
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Open Admin View
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Back Home
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">Stored tokens</h2>
          <p className="mt-1 text-sm text-muted">
            These values came from the emulator token endpoint.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted">Access token</p>
              <code className="mt-2 block break-all rounded-xl bg-background/70 p-3 text-xs leading-6">
                {session.accessToken}
              </code>
            </div>
            {session.refreshToken ? (
              <div>
                <p className="text-sm font-medium text-muted">Refresh token</p>
                <code className="mt-2 block break-all rounded-xl bg-background/70 p-3 text-xs leading-6">
                  {session.refreshToken}
                </code>
              </div>
            ) : null}
            {session.idToken ? (
              <div>
                <p className="text-sm font-medium text-muted">ID token</p>
                <code className="mt-2 block break-all rounded-xl bg-background/70 p-3 text-xs leading-6">
                  {session.idToken}
                </code>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">Session summary</h2>
          <p className="mt-1 text-sm text-muted">
            The app stores a cookie-backed session after the callback completes.
          </p>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </section>

      <UserInfoPanel />
    </main>
  );
}
