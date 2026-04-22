import Link from "next/link";

import { hasSupabaseEnv } from "@/lib/env";

const roadmap = [
  "Scan QR to open the app and sign in with email",
  "Create one cat profile in under two minutes",
  "Log food, activity, medications, and abnormal events quickly",
  "See follow-ups, reminders, and trend summaries at login",
];

export default function HomePage() {
  const supabaseReady = hasSupabaseEnv();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="paper-card px-6 py-8 sm:px-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Web MVP
        </p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-neutral-900 sm:text-5xl">
          Track your cat&apos;s health with a flow that feels warm, fast, and easy to use.
        </h2>
        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-neutral-800">
          The current app already supports live onboarding, quick logging, and
          dashboard follow-ups on top of Supabase. The next product step is
          turning that working foundation into a complete MVP with stronger
          trends, summaries, and sharing.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link className="cta-button" href="/signin">
            Start sign in flow
          </Link>
          <Link className="cta-button" href="/onboarding">
            Create cat profile
          </Link>
          <Link className="cta-button" href="/dashboard">
            Open dashboard
          </Link>
          <Link className="cta-button" href="/logs/new">
            Open quick log
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {roadmap.map((item) => (
            <div
              key={item}
              className="rounded-[24px] border-4 border-neutral-900 bg-white/70 p-4 shadow-[5px_5px_0_0_#171717]"
            >
              <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
                Core flow
              </p>
              <p className="mt-2 text-lg font-bold leading-7 text-neutral-900">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="paper-card px-6 py-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Design direction
          </p>
          <h3 className="mt-3 text-2xl font-black text-neutral-900">
            Playful logging, not clinical data entry
          </h3>
          <p className="mt-4 text-sm font-medium leading-6 text-neutral-800">
            The quick-log flow uses warm colors, chunky outlines, and a clear
            mobile-first call to action so health tracking feels approachable.
          </p>
        </div>

        <div className="paper-card px-6 py-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Backend status
          </p>
          <div className="mt-4 rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
            <p className="text-lg font-black text-neutral-900">
              {supabaseReady ? "Supabase env detected" : "Supabase env missing"}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
              {supabaseReady
                ? "Auth, cat profile writes, logging, and dashboard reads can run against the live Supabase project."
                : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live auth and data."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
