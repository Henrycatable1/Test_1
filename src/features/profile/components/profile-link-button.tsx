"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchActiveCatBundle } from "@/features/app/lib/live-data";

export function ProfileLinkButton() {
  const [catName, setCatName] = useState("your cat");

  useEffect(() => {
    let isMounted = true;

    void fetchActiveCatBundle()
      .then((bundle) => {
        if (isMounted && bundle?.cat?.name) {
          setCatName(bundle.cat.name);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Link className="cta-button" href="/cat-profile">
      Check {catName}&apos;s profile
    </Link>
  );
}
