import Link from "next/link";

import { hasSupabaseEnv } from "@/lib/env";
import { EmailSignInForm } from "@/features/auth/components/email-sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{
    auth_error?: string;
    reason?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const supabaseReady = hasSupabaseEnv();
  const localPreviewEmail = process.env.LOCAL_PREVIEW_TEST_EMAIL ?? null;
  const resolvedSearchParams = await searchParams;
  const hasAuthError = resolvedSearchParams.auth_error === "1";
  const authErrorReason = resolvedSearchParams.reason ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <section className="paper-card px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Email sign in
        </p>
        <h2 className="mt-3 text-4xl font-black text-neutral-900">
          Start the MVP sign-in flow
        </h2>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Use a magic link to sign in and unlock the real onboarding, logging,
          and dashboard flows powered by Supabase.
        </p>

        <div className="mt-6 rounded-[24px] border-4 border-neutral-900 bg-white/75 p-5 shadow-[5px_5px_0_0_#171717]">
          <p className="text-lg font-black text-neutral-900">
            {supabaseReady ? "Supabase is configured" : "Supabase keys not added yet"}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
            {supabaseReady
              ? "Use the magic-link flow when email delivery works, or use the local preview password fallback while the Supabase SMTP path is down."
              : "Add the values from `.env.example` to unlock real email auth using Supabase."}
          </p>
        </div>

        {supabaseReady ? (
          <div className="mt-6">
            <EmailSignInForm
              authErrorReason={authErrorReason}
              hasAuthError={hasAuthError}
              localPreviewEmail={localPreviewEmail}
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link className="cta-button" href="/onboarding">
            Continue to onboarding
          </Link>
          <Link className="cta-button" href="/">
            Back home
          </Link>
        </div>
      </section>
    </div>
  );
}
