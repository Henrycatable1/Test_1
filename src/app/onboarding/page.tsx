import Link from "next/link";

import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <section className="paper-card px-6 py-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Cat onboarding
        </p>
        <h2 className="mt-3 text-4xl font-black text-neutral-900">
          Create the first cat profile
        </h2>
        <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-neutral-800">
          This is the first real MVP data entry flow. The fields match the product
          docs and the initial database schema so onboarding, dashboard, and
          logging can converge on one shared model.
        </p>

        <div className="mt-8">
          <OnboardingForm />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link className="cta-button" href="/logs/new">
            Go to quick log
          </Link>
          <Link className="cta-button" href="/dashboard">
            View dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
