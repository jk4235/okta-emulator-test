import Link from "next/link";
import { redirect } from "next/navigation";
import { getOktaScenario } from "@/lib/okta-scenarios";
import { getSession } from "@/lib/session";
import { UserInfoPanel } from "@/app/dashboard/userinfo-panel";

function expectationStatus(pass: boolean): string {
  return pass ? "Pass" : "Needs review";
}

export default async function ScenarioResultPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  if (session.scenario.id !== scenario) {
    redirect(`/scenarios/${session.scenario.id}`);
  }

  const definition = getOktaScenario(session.scenario.id);
  if (!definition) {
    redirect("/");
  }

  const groupsPresent = (session.user.groups?.length ?? 0) > 0;
  const callbackMatches =
    definition.expectedCallbackMethod === undefined ||
    definition.expectedCallbackMethod === session.scenario.callbackMethod;
  const groupsMatch = session.scenario.expectsGroups
    ? groupsPresent
    : !groupsPresent;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-panel-border bg-panel p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted">Scenario result</p>
            <h1 className="text-3xl font-semibold">{definition.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted">
              {definition.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Scenario Gallery
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Admin
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
          <h2 className="text-lg font-semibold">Expected path</h2>
          <div className="mt-4 space-y-4 text-sm leading-6">
            <div>
              <p className="font-medium text-muted">On the emulator page</p>
              <p>{definition.emulatorExpectation}</p>
            </div>
            <div>
              <p className="font-medium text-muted">Back inside the app</p>
              <p>{definition.appExpectation}</p>
            </div>
            <div>
              <p className="font-medium text-muted">Manual sign-out check</p>
              <p>
                Use the sign-out button and confirm the browser returns to the
                home page through the emulator logout endpoint.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-panel-border bg-panel p-5">
          <h2 className="text-lg font-semibold">Actual verification</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-panel-border bg-background/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Callback method
              </p>
              <p className="mt-2 text-xl font-semibold">
                {session.scenario.callbackMethod}
              </p>
              <p className="mt-2 text-sm text-muted">
                {expectationStatus(callbackMatches)} against expected{" "}
                {definition.expectedCallbackMethod ?? "N/A"}.
              </p>
            </div>
            <div className="rounded-2xl border border-panel-border bg-background/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Group claims
              </p>
              <p className="mt-2 text-xl font-semibold">
                {groupsPresent ? "Present" : "Absent"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {expectationStatus(groupsMatch)} against expected{" "}
                {session.scenario.expectsGroups ? "presence" : "absence"}.
              </p>
            </div>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/70 p-4 text-xs leading-6">
            {JSON.stringify(
              {
                scenario: session.scenario,
                oauth: session.oauth,
                user: session.user,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </section>

      <section className="rounded-2xl border border-panel-border bg-panel p-5">
        <h2 className="text-lg font-semibold">What to confirm manually</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>Correct authorize URL family for this scenario.</li>
          <li>Expected emulator experience before user selection.</li>
          <li>Expected callback transport: query redirect or auto-submitted form.</li>
          <li>Expected issuer and scope on the result page.</li>
          <li>Expected final sign-out redirect back to the gallery.</li>
        </ul>
      </section>

      <UserInfoPanel />
    </main>
  );
}
