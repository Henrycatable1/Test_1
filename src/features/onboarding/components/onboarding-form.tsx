"use client";

import {
  buildOnboardingInsertPayload,
  buildOnboardingUpdatePayload,
  emptyOnboardingValues,
  mapCatRowToOnboardingValues,
  type OnboardingFormValues,
} from "@/features/onboarding/lib/onboarding-cat";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState<OnboardingFormValues>(emptyOnboardingValues);
  const [existingCatId, setExistingCatId] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setIsLoadingExisting(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !user) {
        setIsLoadingExisting(false);
        return;
      }

      const { data: existingCats, error: catLookupError } = await supabase
        .from("cats")
        .select("id, name, age_months, gender, breed, initial_weight_kg, personality")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (!isMounted) {
        return;
      }

      if (catLookupError) {
        setError(catLookupError.message);
        setIsLoadingExisting(false);
        return;
      }

      const existingCat = existingCats?.[0];

      // ### re-entry must edit the owned cat instead of replacing it with blank form defaults
      if (existingCat) {
        setExistingCatId(existingCat.id);
        setValues(mapCatRowToOnboardingValues(existingCat));
      }

      setIsLoadingExisting(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase is not configured in the local app environment.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaved(false);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError(userError.message);
      setIsSaving(false);
      return;
    }

    if (!user) {
      setError("Sign in before creating a cat profile.");
      setIsSaving(false);
      return;
    }

    let payload;

    try {
      payload = existingCatId
        ? buildOnboardingUpdatePayload(values)
        : buildOnboardingInsertPayload(user.id, values);
    } catch (payloadError) {
      setError(payloadError instanceof Error ? payloadError.message : "Invalid cat profile values.");
      setIsSaving(false);
      return;
    }

    const mutation = existingCatId
      ? supabase.from("cats").update(payload).eq("id", existingCatId)
      : supabase.from("cats").insert(payload);
    const { error: saveError } = await mutation;

    if (saveError) {
      setError(saveError.message);
      setIsSaving(false);
      return;
    }

    setSaved(true);
    setIsSaving(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (isLoadingExisting) {
    return (
      <section className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 text-sm font-medium leading-6 text-neutral-800 shadow-[5px_5px_0_0_#171717]">
        <p className="font-black uppercase tracking-[0.16em] text-neutral-700">
          Loading cat profile
        </p>
        <p className="mt-2">Checking whether this account already has a cat to edit.</p>
      </section>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Cat name
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Miso"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Age (years)
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            type="number"
            min="0"
            step="0.1"
            value={values.ageYears}
            onChange={(event) =>
              setValues((current) => ({ ...current, ageYears: event.target.value }))
            }
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Sex
          </span>
          <select
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            value={values.sex}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                sex: event.target.value as OnboardingFormValues["sex"],
              }))
            }
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="neutered_female">Neutered female</option>
            <option value="neutered_male">Neutered male</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Breed
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            value={values.breed}
            onChange={(event) =>
              setValues((current) => ({ ...current, breed: event.target.value }))
            }
            placeholder="Domestic shorthair"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
            Weight (kg)
          </span>
          <input
            className="w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
            type="number"
            min="0"
            step="0.1"
            value={values.weightKg}
            onChange={(event) =>
              setValues((current) => ({ ...current, weightKg: event.target.value }))
            }
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neutral-700">
          Personality
        </span>
        <textarea
          className="min-h-32 w-full rounded-[20px] border-4 border-neutral-900 bg-white px-4 py-3 font-medium text-neutral-900"
          value={values.personality}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              personality: event.target.value,
            }))
          }
          placeholder="Food-motivated, shy with guests, playful after dinner."
          required
        />
      </label>

      <div className="rounded-[24px] border-4 border-neutral-900 bg-white/75 p-4 text-sm font-medium leading-6 text-neutral-800 shadow-[5px_5px_0_0_#171717]">
        <p className="font-black uppercase tracking-[0.16em] text-neutral-700">
          Live cat profile
        </p>
        <p className="mt-2">
          {existingCatId
            ? "This account already has a cat. Saving updates that profile and keeps existing health conditions."
            : "This onboarding flow writes directly to the real `cats` table for the signed-in owner."}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button className="cta-button" disabled={isSaving} type="submit">
          {isSaving
            ? "Saving profile..."
            : existingCatId
              ? "Update cat profile"
              : "Save cat profile"}
        </button>
        {saved ? (
          <p className="rounded-full border-4 border-neutral-900 bg-emerald-200 px-4 py-2 text-sm font-black text-neutral-900 shadow-[4px_4px_0_0_#171717]">
            Saved to Supabase. Redirecting to the live dashboard.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[20px] border-4 border-neutral-900 bg-rose-100 px-4 py-2 text-sm font-medium text-neutral-900 shadow-[4px_4px_0_0_#171717]">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
