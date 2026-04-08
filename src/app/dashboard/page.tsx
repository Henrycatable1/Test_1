import Link from "next/link";

import { getDashboardState } from "@/features/dashboard/logic/get-dashboard-state";

const priorityStyles = {
  High: "bg-rose-200",
  Medium: "bg-amber-200",
  Low: "bg-emerald-200",
};

export default function DashboardPage() {
  const dashboardState = getDashboardState();
  const topAction = dashboardState.topAction;

  return (
    <div className="space-y-6">
      <section className="paper-card grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Today&apos;s overview
          </p>
          <h2 className="mt-3 text-4xl font-black text-neutral-900">
            {dashboardState.cat.name} looks mostly stable, but there are{" "}
            {dashboardState.followUps.length} follow-ups to check.
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-neutral-800">
            The dashboard now uses a typed rule helper so the next-best-action
            block is driven by the same domain model the real backend will use.
          </p>
        </div>

        <div className="rounded-[28px] border-4 border-neutral-900 bg-white/75 p-5 shadow-[6px_6px_0_0_#171717]">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
            Next best action
          </p>
          <h3 className="mt-3 text-2xl font-black text-neutral-900">
            {topAction?.title ?? "No follow-up needed right now"}
          </h3>
          <p className="mt-3 text-sm font-medium leading-6 text-neutral-800">
            {topAction?.detail ??
              "Once real logs are connected, the dashboard will use your latest entries and medication plans."}
          </p>
          <Link
            className="cta-button mt-5"
            href={topAction?.relatedLogType ? `/logs/new/${topAction.relatedLogType}` : "/logs/new"}
          >
            Log follow-up now
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="paper-card px-6 py-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
            Follow-up queue
          </p>
          <div className="mt-5 space-y-4">
            {dashboardState.followUps.map((card) => (
              <article
                key={card.id}
                className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 shadow-[5px_5px_0_0_#171717]"
              >
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-neutral-900 ${priorityStyles[card.priority]}`}
                >
                  {card.priority}
                </div>
                <h3 className="mt-3 text-xl font-black text-neutral-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
                  {card.detail}
                </p>
              </article>
            ))}
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
                  <div className="text-4xl font-black text-neutral-900">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
