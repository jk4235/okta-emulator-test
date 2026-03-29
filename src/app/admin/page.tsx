import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminData } from "./admin-data";
import { getSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-panel-border bg-panel p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Management API demo</p>
            <h1 className="mt-2 text-3xl font-semibold">
              Okta admin data through local proxy routes
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              These requests hit your local Next.js routes, which then call the
              emulator&apos;s Management API with `Authorization: SSWS
              test_token_admin`.
            </p>
            <p className="mt-2 text-sm text-muted">
              Active scenario: {session.scenario.title}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/scenarios/${session.scenario.id}`}
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Scenario Result
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
            >
              Home
            </Link>
          </div>
        </div>
      </section>

      <AdminData />
    </main>
  );
}
