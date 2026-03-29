import Link from "next/link";
import { OKTA_BROWSER_SCENARIOS } from "@/lib/okta-scenarios";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-12">
      <section className="flex w-full flex-col gap-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-panel-border bg-panel px-3 py-1 text-sm text-muted">
              Real-world validation for the local Okta emulator
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Okta browser scenario lab for your local emulator
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                This project is now designed for manual browser regression
                testing. Each scenario below opens a different Okta login path
                so you can validate callback modes, issuer differences, group
                claims, logout, and expected authorize failures.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-panel-border bg-panel p-5">
                <p className="text-sm font-medium text-muted">Scenario gallery</p>
                <p className="mt-2 text-sm leading-6">
                  Multiple browser-visible entry points instead of a single demo
                  login button.
                </p>
              </div>
              <div className="rounded-2xl border border-panel-border bg-panel p-5">
                <p className="text-sm font-medium text-muted">Real callbacks</p>
                <p className="mt-2 text-sm leading-6">
                  Covers both query redirects and real `form_post` callback
                  handling.
                </p>
              </div>
              <div className="rounded-2xl border border-panel-border bg-panel p-5">
                <p className="text-sm font-medium text-muted">Expected failures</p>
                <p className="mt-2 text-sm leading-6">
                  Includes intentional invalid client and invalid redirect URI
                  scenarios that should stop on emulator error pages.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-panel-border bg-panel p-8 shadow-sm">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted">How to use it</p>
              <h2 className="text-2xl font-semibold">Run and compare behaviors</h2>
              <p className="text-sm leading-6 text-muted">
                Start the emulator with `npx emulate --service okta --port 4007
                --seed emulate.config.yaml`, then launch any scenario card
                below. For success cases, select a seeded user on the emulator
                page and compare the resulting app page against the scenario
                expectations.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-panel-border bg-background/50 p-4 text-sm text-muted">
                Seeded users: `alice@example.com`, `bob@example.com`, plus the
                emulator&apos;s default test user.
              </div>
              <div className="rounded-2xl border border-panel-border bg-background/50 p-4 text-sm text-muted">
                Success scenarios return to app-hosted result pages. Failure
                scenarios intentionally stop on emulator-hosted HTML errors.
              </div>
              {session ? (
                <div className="rounded-2xl border border-panel-border bg-background/50 p-4 text-sm text-muted">
                  Currently signed in as {session.user.email}. Continue to{" "}
                  <Link href={`/scenarios/${session.scenario.id}`} className="font-medium underline">
                    the latest scenario result
                  </Link>{" "}
                  or open{" "}
                  <Link href="/dashboard" className="font-medium underline">
                    dashboard
                  </Link>
                  .
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <span className="inline-flex rounded-full border border-panel-border bg-panel px-3 py-1 text-sm text-muted">
            Scenario Gallery
          </span>
          <div className="grid gap-4 lg:grid-cols-2">
            {OKTA_BROWSER_SCENARIOS.map((scenario) => (
              <article
                key={scenario.id}
                className="rounded-3xl border border-panel-border bg-panel p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-panel-border px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted">
                    {scenario.outcomeLabel}
                  </span>
                  <span className="rounded-full border border-panel-border px-3 py-1 text-xs text-muted">
                    {scenario.authServer === "org" ? "Org AS" : "Default AS"}
                  </span>
                  <span className="rounded-full border border-panel-border px-3 py-1 text-xs text-muted">
                    {scenario.responseMode}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <h2 className="text-2xl font-semibold">{scenario.title}</h2>
                  <p className="text-sm leading-6 text-muted">
                    {scenario.summary}
                  </p>
                </div>

                <div className="mt-6 space-y-3 text-sm leading-6">
                  <div>
                    <p className="font-medium text-muted">Expected on emulator</p>
                    <p>{scenario.emulatorExpectation}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted">Expected in app</p>
                    <p>{scenario.appExpectation}</p>
                  </div>
                </div>

                <a
                  href={`/api/auth/okta?scenario=${scenario.id}`}
                  className="mt-6 flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Open {scenario.title}
                </a>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
