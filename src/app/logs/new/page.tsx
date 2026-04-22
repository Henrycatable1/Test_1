import { LogOptionCard } from "@/components/logging/log-option-card";
import { ProfileLinkButton } from "@/features/profile/components/profile-link-button";
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
          Choose the update you want to save first, then fill in a short focused
          form instead of working through one long clinical screen.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-3">
          {logCategories.map((category) => (
            <LogOptionCard key={category.id} category={category} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <ProfileLinkButton />
        </div>
      </section>
    </div>
  );
}
