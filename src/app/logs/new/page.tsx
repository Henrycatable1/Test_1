import Link from "next/link";

import { LogOptionCard } from "@/components/logging/log-option-card";
import { logCategories } from "@/lib/app-data";

export default function NewLogPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="paper-card px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-center text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
          Quick log
        </p>
        <h2 className="mt-3 text-center text-4xl font-black text-neutral-900 sm:text-5xl">
          What would you like to log?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base font-medium leading-7 text-neutral-800">
          This screen intentionally leans into the reference image&apos;s idea:
          clear choice blocks, warm pastel colors, and a decisive CTA instead of
          a long clinical form.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-3">
          {logCategories.map((category) => (
            <LogOptionCard key={category.id} category={category} />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 rounded-[28px] border-4 border-neutral-900 bg-white/70 p-5 text-center shadow-[6px_6px_0_0_#171717]">
          <p className="max-w-xl text-sm font-medium leading-6 text-neutral-800">
            Each card now opens a typed category form. The next backend step is
            wiring those payloads into Supabase inserts and replacing demo save
            behavior with authenticated writes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link className="cta-button" href="/dashboard">
              I&apos;m done, show dashboard
            </Link>
            <Link className="cta-button" href="/">
              Back to overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
