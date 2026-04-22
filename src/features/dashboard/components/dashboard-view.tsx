"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buildDashboardState, fetchActiveCatBundle } from "@/features/app/lib/live-data";
import type { ActiveCatBundle, DashboardState } from "@/types/domain";

const priorityStyles = {
  High: "bg-rose-200",
  Medium: "bg-amber-200",
  Low: "bg-emerald-200",
};

export function DashboardView() {
  const [bundle, setBundle] = useState<ActiveCatBundle | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetchActiveCatBundle()
      .then((nextBundle) => {
        if (isMounted) {
          setBundle(nextBundle);
        }
      })
      .catch((nextError: unknown) => {
        if (isMounted) {
          // ### leave the loading state when the fetch fails so the user sees the real failure message
          setBundle(null);
          setError(nextError instanceof Error ? nextError.message : "Failed to load dashboard data.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="paper-card px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Dashboard unavailable
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">{error}</p>
      </section>
    );
  }

  if (bundle === undefined) {
    return (
      <section className="paper-card px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Loading dashboard
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Pulling the latest cat status, trends, and alert state from Supabase.
        </p>
      </section>
    );
  }

  if (!bundle) {
    return (
      <section className="paper-card px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Sign in first
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Use the email sign-in flow so the dashboard can load your real cat records and alerts.
        </p>
        <div className="mt-6">
          <Link className="cta-button" href="/signin">
            Go to sign in
          </Link>
        </div>
      </section>
    );
  }

  if (!bundle.cat) {
    return (
      <section className="paper-card px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          No cat profile yet
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Finish onboarding to create the first cat profile before checking the live dashboard.
        </p>
        <div className="mt-6">
          <Link className="cta-button" href="/onboarding">
            Create cat profile
          </Link>
        </div>
      </section>
    );
  }

  const dashboardState: DashboardState = buildDashboardState(bundle);
  const topAction = dashboardState.topAction;
  const isReviewPending = dashboardState.alertReview?.isPending ?? false;

  return (
    <div className="space-y-6">
      <section className="paper-card grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Today&apos;s overview
          </p>
          <h2 className="mt-3 text-4xl font-black text-neutral-900">
            {dashboardState.cat?.name} has {dashboardState.followUps.length} active follow-up
            {dashboardState.followUps.length === 1 ? "" : "s"} to review.
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-neutral-800">
            The dashboard is now using live cat records, active alerts, and recent health logs from
            Supabase.
          </p>
          {isReviewPending ? (
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">
              We&apos;re reviewing today&apos;s latest logs now. Updated feedback should appear shortly.
            </p>
          ) : null}
          {dashboardState.lastUpdatedLabel ? (
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">
              Latest record date: {dashboardState.lastUpdatedLabel}
            </p>
          ) : null}
        </div>

        <div className="rounded-[28px] border-4 border-neutral-900 bg-white/75 p-5 shadow-[6px_6px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
            Next best action
          </p>
          <h3 className="mt-3 text-2xl font-black text-neutral-900">
            {topAction?.title ?? "No urgent follow-up needed right now"}
          </h3>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-800">
            {topAction?.detail ??
              "Keep logging food, activity, symptoms, and weight so the app can continue watching for trends."}
          </p>
          <Link
            className="cta-button mt-5"
            href={topAction?.relatedLogType ? `/logs/new/${topAction.relatedLogType}` : "/logs/new"}
          >
            Log follow-up now
          </Link>
        </div>
      </section>

      {isReviewPending ? (
        <section className="paper-card px-6 py-5">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Review in progress
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-800">
            Recent logging activity reset the 30-second review window. We&apos;ll check the latest cat
            state and alerts after the logging burst settles.
          </p>
          {dashboardState.alertReview?.lastError ? (
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">
              Latest worker note: {dashboardState.alertReview.lastError}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="paper-card px-6 py-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Follow-up queue
          </p>
          <div className="mt-5 space-y-4">
            {dashboardState.followUps.length > 0 ? (
              dashboardState.followUps.map((card) => (
                <article
                  key={card.id}
                  className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]"
                >
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-neutral-900 ${priorityStyles[card.priority]}`}
                  >
                    {card.priority}
                  </div>
                  <h3 className="mt-3 text-xl font-black text-neutral-900">{card.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
                    {card.detail}
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
                <h3 className="text-xl font-black text-neutral-900">No active alerts</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
                  The current alert queue is clear. Keep adding daily records to maintain fresh trend
                  and reminder coverage.
                </p>
              </article>
            )}
          </div>
        </div>

        <div className="paper-card px-6 py-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Last 7 days
          </p>
          <div className="mt-5 space-y-4">
            {dashboardState.weeklyMetrics.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]"
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-neutral-800">
                      {item.note}
                    </p>
                  </div>
                  <div className="text-4xl font-black text-neutral-900">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
