import Link from "next/link";
import { notFound } from "next/navigation";

import { LogEntryForm } from "@/features/logging/components/log-entry-form";
import { logFormConfig } from "@/features/logging/config/logging-config";
import type { LogItemId } from "@/types/domain";

type PageProps = {
  params: Promise<{
    category: string;
  }>;
};

function isLogItemId(value: string): value is LogItemId {
  return value in logFormConfig;
}

export default async function LogCategoryPage({ params }: PageProps) {
  const { category } = await params;

  if (!isLogItemId(category)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <section className="paper-card px-6 py-8">
        <LogEntryForm category={category} />

        <div className="mt-8 flex flex-wrap gap-4">
          <Link className="cta-button" href="/logs/new">
            Back to all log types
          </Link>
          <Link className="cta-button" href="/dashboard">
            View dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
