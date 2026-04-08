import Link from "next/link";

import type { LogCategory } from "@/lib/app-data";

type LogOptionCardProps = {
  category: LogCategory;
};

export function LogOptionCard({ category }: LogOptionCardProps) {
  return (
    <Link
      href={`/logs/new/${category.id}`}
      className={`group flex min-h-36 flex-col justify-between rounded-[28px] border-4 border-neutral-900 p-4 text-left shadow-[6px_6px_0_0_#171717] transition-transform hover:-translate-y-1 ${category.accentClass}`}
    >
      <div className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-700">
        {category.id.replaceAll("_", " ")}
      </div>

      <div>
        <h3 className="text-2xl font-black text-neutral-900">{category.label}</h3>
        <p className="mt-2 text-sm font-medium leading-6 text-neutral-800">
          {category.hint}
        </p>
      </div>

      <div className="mt-4 text-sm font-black text-neutral-900">
        Tap to log
        <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}
