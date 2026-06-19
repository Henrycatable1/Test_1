"use client";

import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const supportedOtpTypes = new Set<EmailOtpType>([
  "signup",
  "magiclink",
  "invite",
  "recovery",
  "email_change",
  "email",
]);

function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  // ### keep post-auth redirects on this app instead of allowing protocol-relative URLs
  if (!normalizedInput || !normalizedInput.startsWith("/") || normalizedInput.startsWith("//")) {
    return "/dashboard";
  }

  return normalizedInput;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Finalizing your sign-in session...");

  useEffect(() => {
    let isMounted = true;

    async function finalizeSession() {
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get("code");
      const tokenHash = currentUrl.searchParams.get("token_hash");
      const otpType = currentUrl.searchParams.get("type");
      const nextPath = toSafeNextPath(currentUrl.searchParams.get("next"));

      try {
        // ### finalize code/token callbacks on the server so auth cookies are set by the redirect response
        if (code || (tokenHash && otpType && supportedOtpTypes.has(otpType as EmailOtpType))) {
          const serverCallbackUrl = new URL("/auth/callback/server", currentUrl.origin);
          serverCallbackUrl.searchParams.set("next", nextPath);

          if (code) {
            serverCallbackUrl.searchParams.set("code", code);
          }

          if (tokenHash && otpType) {
            serverCallbackUrl.searchParams.set("token_hash", tokenHash);
            serverCallbackUrl.searchParams.set("type", otpType);
          }

          window.location.replace(serverCallbackUrl.toString());
          return;
        }

        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          throw new Error("missing_config");
        }

        {
          const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          // ### handle hash-token callbacks by explicitly setting browser session when tokens are present
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw new Error("invalid_or_expired");
            }
          } else {
            throw new Error("missing_token");
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error("session_missing");
        }

        if (isMounted) {
          setStatusMessage("Session ready. Redirecting...");
        }

        router.replace(nextPath);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "invalid_or_expired";
        router.replace(`/signin?auth_error=1&reason=${encodeURIComponent(reason)}`);
      }
    }

    void finalizeSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <section className="paper-card mx-auto max-w-2xl px-6 py-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">Finishing sign in</p>
      <p className="mt-4 text-base font-medium leading-7 text-neutral-800">{statusMessage}</p>
    </section>
  );
}
