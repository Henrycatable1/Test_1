import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cat Health Log",
  description: "A playful web MVP for logging cat health, spotting trends, and sharing summaries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="paper-card mb-6 flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-neutral-700">
                MVP 1.0
              </p>
              <h1 className="mt-2 text-3xl font-black text-neutral-900">
                Cat Health Log
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-neutral-800">
                A web-first MVP for fast cat care logging, follow-up prompts, and
                exportable summaries for vet visits.
              </p>
            </div>

            <nav className="flex flex-wrap gap-3 text-sm font-black">
              <Link className="cta-button" href="/">
                Home
              </Link>
              <Link className="cta-button" href="/dashboard">
                Dashboard
              </Link>
              <Link className="cta-button" href="/logs/new">
                Quick Log
              </Link>
            </nav>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
