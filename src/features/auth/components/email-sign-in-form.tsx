"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type EmailSignInFormProps = {
  localPreviewEmail?: string | null;
  hasAuthError?: boolean;
  authErrorReason?: string | null;
};

export function EmailSignInForm({
  localPreviewEmail = null,
  hasAuthError = false,
  authErrorReason = null,
}: EmailSignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passwordEmail, setPasswordEmail] = useState(localPreviewEmail ?? "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const canonicalAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? null;

  function resolveCallbackOrigin() {
    const browserOrigin = window.location.origin;

    if (!canonicalAppUrl) {
      return browserOrigin;
    }

    try {
      const canonical = new URL(canonicalAppUrl);
      const current = new URL(browserOrigin);
      const localHosts = new Set(["localhost", "127.0.0.1"]);
      const bothLocal = localHosts.has(canonical.hostname) && localHosts.has(current.hostname);

      // ### avoid stale localhost aliases/ports in env so magic-link callbacks return to the active dev origin
      if (bothLocal && canonical.origin !== current.origin) {
        return browserOrigin;
      }
    } catch {
      return browserOrigin;
    }

    return canonicalAppUrl;
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setHasSession(Boolean(data.session));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase is not configured in the local app environment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    // ### prefer canonical URL, but never let stale local env redirect to a different local host/port
    const callbackOrigin = resolveCallbackOrigin();
    const emailRedirectTo = `${callbackOrigin}/auth/callback?next=/onboarding`;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (signInError) {
      const nextErrorMessage =
        "status" in signInError && signInError.status === 500
          ? "Supabase could not send the magic link email. Check the project's Auth email or SMTP configuration."
          : signInError.message;
      setError(nextErrorMessage);
      setIsSubmitting(false);
      return;
    }

    setMessage("Check your email for the magic link to finish signing in.");
    setIsSubmitting(false);
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setPasswordError("Supabase is not configured in the local app environment.");
      return;
    }

    setIsPasswordSubmitting(true);
    setPasswordError(null);
    setPasswordMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: passwordEmail,
      password,
    });

    if (signInError) {
      setPasswordError(signInError.message);
      setIsPasswordSubmitting(false);
      return;
    }

    // ### keep a localhost fallback available for MVP verification when the Supabase email provider is down
    setPasswordMessage("Password sign-in succeeded. Redirecting to onboarding.");
    setIsPasswordSubmitting(false);
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Email
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <button className="cta-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending magic link..." : "Email me a sign-in link"}
        </button>
      </form>

      {message ? (
        <p className="rounded-[20px] border-4 border-neutral-900 bg-emerald-100 px-4 py-3 text-sm font-medium text-neutral-900 shadow-[4px_4px_0_0_#171717]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[20px] border-4 border-neutral-900 bg-rose-100 px-4 py-3 text-sm font-medium text-neutral-900 shadow-[4px_4px_0_0_#171717]">
          {error}
        </p>
      ) : null}

      {hasAuthError ? (
        <div className="rounded-[20px] border-4 border-neutral-900 bg-amber-100 px-4 py-3 text-sm font-medium text-neutral-900 shadow-[4px_4px_0_0_#171717]">
          <p>
            {authErrorReason === "missing_token"
              ? "The callback link did not include a usable sign-in token. Please request a new sign-in email and open the newest link."
              : authErrorReason === "invalid_or_expired"
                ? "That sign-in link is invalid or expired. Please request a fresh sign-in email and use it once."
                : authErrorReason === "session_missing"
                  ? "We verified the link but could not persist your browser session. Confirm NEXT_PUBLIC_APP_URL matches the host you opened, then request a new sign-in email."
                  : authErrorReason === "missing_config"
                    ? "Supabase auth keys are missing in this local app environment. Add the required values to `.env.local` and retry."
                    : "We couldn't finish creating your sign-in session from the callback link. Please request a fresh sign-in email and try again."}
          </p>
          <p className="mt-2">
            Retry steps: request a fresh email, open only the newest link once, and make sure sign-in and callback use the same host (`127.0.0.1` or `localhost`, not mixed).
          </p>
        </div>
      ) : null}

      <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-5 shadow-[5px_5px_0_0_#171717]">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
          Local preview fallback
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
          If Supabase email delivery is down, use the local preview fallback with the password from
          `.env.local` to keep testing onboarding, logging, and dashboard flows.
        </p>

        <form className="mt-5 space-y-5" onSubmit={handlePasswordSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
              Preview email
            </span>
            <input
              className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
              onChange={(event) => setPasswordEmail(event.target.value)}
              placeholder="local-preview@example.com"
              required
              type="email"
              value={passwordEmail}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
              Preview password
            </span>
            <input
              className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button className="cta-button" disabled={isPasswordSubmitting} type="submit">
            {isPasswordSubmitting ? "Signing in..." : "Sign in with password"}
          </button>
        </form>

        {passwordMessage ? (
          <p className="mt-4 rounded-[20px] border-4 border-neutral-900 bg-emerald-100 px-4 py-3 text-sm font-medium text-neutral-900 shadow-[4px_4px_0_0_#171717]">
            {passwordMessage}
          </p>
        ) : null}

        {passwordError ? (
          <p className="mt-4 rounded-[20px] border-4 border-neutral-900 bg-rose-100 px-4 py-3 text-sm font-medium text-neutral-900 shadow-[4px_4px_0_0_#171717]">
            {passwordError}
          </p>
        ) : null}
      </div>

      {hasSession ? (
        <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Signed in
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
            You already have an active session in this browser.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="cta-button" href="/dashboard">
              Go to dashboard
            </Link>
            <Link className="cta-button" href="/onboarding">
              Continue onboarding
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
