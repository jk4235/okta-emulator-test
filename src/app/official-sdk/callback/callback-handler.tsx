"use client";

import { useEffect, useState } from "react";
import { getOfficialOktaAuth } from "@/lib/official-okta-sdk";

export function CallbackHandler() {
  const [message, setMessage] = useState("Processing redirect callback...");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const authClient = getOfficialOktaAuth();
        const { tokens } = await authClient.token.parseFromUrl();
        authClient.tokenManager.setTokens(tokens);

        if (!cancelled) {
          setMessage("Callback completed. Redirecting to the SDK test page...");
          window.location.replace("/official-sdk");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? `Official SDK callback failed: ${error.message}`
              : "Official SDK callback failed.",
          );
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-3xl border border-panel-border bg-panel p-8 shadow-sm">
      <p className="text-sm font-medium text-muted">Official SDK callback</p>
      <h1 className="mt-3 text-3xl font-semibold">Handling redirect response</h1>
      <p className="mt-4 text-sm leading-6 text-muted">{message}</p>
    </section>
  );
}
