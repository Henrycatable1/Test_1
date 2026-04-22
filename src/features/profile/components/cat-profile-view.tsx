"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  buildDashboardState,
  fetchActiveCatBundle,
  formatCatAge,
  formatCatSex,
  getPersonalityTags,
  mapCatRowToProfile,
} from "@/features/app/lib/live-data";
import type { ActiveCatBundle } from "@/types/domain";

function formatRecordSummary(recordDate: string) {
  return new Date(`${recordDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CatProfileView() {
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
          setError(nextError instanceof Error ? nextError.message : "Failed to load the cat profile.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardState = useMemo(() => {
    return bundle ? buildDashboardState(bundle) : null;
  }, [bundle]);

  if (error) {
    return (
      <section className="paper-card mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Profile unavailable
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">{error}</p>
      </section>
    );
  }

  if (bundle === undefined) {
    return (
      <section className="paper-card mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Loading profile
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Pulling the latest cat profile, records, and alert state from Supabase.
        </p>
      </section>
    );
  }

  if (!bundle) {
    return (
      <section className="paper-card mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Sign in first
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Use the email sign-in flow so this page can load your real cat profile and health trend
          history.
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
      <section className="paper-card mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          No cat profile yet
        </p>
        <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
          Finish onboarding to create the first cat profile before viewing health trends.
        </p>
        <div className="mt-6">
          <Link className="cta-button" href="/onboarding">
            Create cat profile
          </Link>
        </div>
      </section>
    );
  }

  const catProfile = mapCatRowToProfile(bundle.cat);
  const personalityTags = getPersonalityTags(catProfile.personality);
  const latestWeight =
    bundle.dailyRecords.findLast((record) => record.weight_kg !== null)?.weight_kg ?? catProfile.weightKg;
  const recentRecords = [...bundle.dailyRecords].reverse().slice(0, 7);
  const isReviewPending = dashboardState?.alertReview?.isPending ?? false;

  return (
    <section className="paper-card mx-auto max-w-4xl px-6 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Cat profile
          </p>
          <h2 className="mt-3 text-4xl font-black text-neutral-900">
            {catProfile.name}&apos;s live health state
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-neutral-800">
            {formatCatAge(catProfile.ageYears)} • {formatCatSex(catProfile.sex)} • {catProfile.breed}
          </p>
        </div>

        <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Current weight
          </p>
          <p className="mt-3 text-3xl font-black text-neutral-900">{latestWeight} kg</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {personalityTags.length > 0 ? (
          personalityTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border-4 border-neutral-900 bg-emerald-100 px-4 py-2 text-sm font-black text-neutral-900 shadow-[3px_3px_0_0_#171717]"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="rounded-full border-4 border-neutral-900 bg-white px-4 py-2 text-sm font-black text-neutral-900 shadow-[3px_3px_0_0_#171717]">
            No personality notes yet.
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-700">
            Active follow-ups
          </p>
          <p className="mt-3 text-3xl font-black text-neutral-900">
            {dashboardState?.followUps.length ?? 0}
          </p>
          {isReviewPending ? (
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">
              Today&apos;s logs are still being reviewed.
            </p>
          ) : null}
        </article>

        <article className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-700">
            Latest action
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-800">
            {dashboardState?.topAction?.detail ?? "No active alerts right now."}
          </p>
        </article>

        <article className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-700">
            Health conditions
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-800">
            {catProfile.underlyingHealthConditions.length > 0
              ? catProfile.underlyingHealthConditions.join(", ")
              : "No underlying health conditions listed."}
          </p>
        </article>
      </div>

      {isReviewPending ? (
        <div className="mt-8 rounded-[24px] border-4 border-neutral-900 bg-white/75 p-5 shadow-[5px_5px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
            Log review pending
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-800">
            We&apos;re checking the latest health logs after the recent activity window settles, so this
            profile may update again shortly.
          </p>
          {dashboardState?.alertReview?.lastError ? (
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-700">
              Latest worker note: {dashboardState.alertReview.lastError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 rounded-[24px] border-4 border-neutral-900 bg-white/75 p-5 shadow-[5px_5px_0_0_#171717]">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
          Recent trend snapshots
        </p>
        <div className="mt-5 space-y-3">
          {recentRecords.length > 0 ? (
            recentRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-4 shadow-[3px_3px_0_0_#171717]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-neutral-900">
                    {formatRecordSummary(record.record_date)}
                  </h3>
                  <Link className="cta-button" href="/logs/new">
                    Add today&apos;s log
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <p className="text-sm font-medium text-neutral-800">
                    Food: {record.food_amount_grams ?? "n/a"} g
                  </p>
                  <p className="text-sm font-medium text-neutral-800">
                    Activity: {record.activity_score ?? "n/a"}
                  </p>
                  <p className="text-sm font-medium text-neutral-800">
                    Vomiting: {record.vomit_times}
                  </p>
                  <p className="text-sm font-medium text-neutral-800">
                    Weight: {record.weight_kg ?? "n/a"} kg
                  </p>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm font-medium leading-6 text-neutral-800">
              No daily health records have been saved yet. Start with food, activity, or symptom
              logs to build the trend history.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
