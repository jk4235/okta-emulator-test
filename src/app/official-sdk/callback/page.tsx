import Link from "next/link";
import { CallbackHandler } from "./callback-handler";

export default function OfficialSdkCallbackPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <section className="flex flex-wrap gap-3">
        <Link
          href="/official-sdk"
          className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
        >
          Back to official SDK page
        </Link>
        <Link
          href="/"
          className="rounded-2xl border border-panel-border px-4 py-2 text-sm font-medium"
        >
          Back to scenario gallery
        </Link>
      </section>

      <CallbackHandler />
    </main>
  );
}
