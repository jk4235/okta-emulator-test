import Link from "next/link";
import { OfficialSdkPanel } from "./official-sdk-panel";

export default function OfficialSdkPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
        >
          Back to scenario gallery
        </Link>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
        >
          Dashboard
        </Link>
      </section>

      <OfficialSdkPanel />
    </main>
  );
}
